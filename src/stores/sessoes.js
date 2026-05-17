import { writable, derived, get } from "svelte/store";
import { listen, invoke } from "../lib/tauri.js";
import {
  findFicheiroByCaminho,
  openSessao as dbOpenSessao,
  closeSessao as dbCloseSessao,
  listSessoes as dbListSessoes,
  corrigirSessao as dbCorrigirSessao,
} from "../lib/db.js";
import { ficheirosByPath } from "./clientes.js";
import { regras } from "./regras.js";
import { defaultRule, idleThresholdMin, rootFolder } from "./settings.js";
import { priceFile } from "../lib/pricing.js";

// Active sessions in memory: caminho -> { sessaoId, ficheiroId, clienteId, clienteNome, nome, startMs, lastActivityMs }
export const activeSessions = writable(new Map());
export const allSessions = writable([]);
export const monitorPaused = writable(false);
export const monitorStatus = writable("idle"); // idle | watching | error
export const monitorError = writable(null);

let unlistenEvent = null;
let watcherStarted = false;
let idleCheckId = null;
let openPollId = null;
let openPollBusy = false;

export async function loadSessions(filter = {}) {
  const rows = await dbListSessoes(filter);
  allSessions.set(rows);
  return rows;
}

export async function startMonitor() {
  const root = get(rootFolder);
  if (!root) {
    monitorError.set("Pasta raiz não definida.");
    monitorStatus.set("error");
    return;
  }
  try {
    await invoke("stop_watching");
  } catch {}
  try {
    await invoke("start_watching", { root });
    watcherStarted = true;
    monitorStatus.set("watching");
    monitorError.set(null);
    monitorPaused.set(false);
  } catch (e) {
    monitorStatus.set("error");
    monitorError.set(String(e));
    return;
  }

  if (!unlistenEvent) {
    unlistenEvent = await listen("file-event", (ev) => {
      if (get(monitorPaused)) return;
      handleFileEvent(ev.payload);
    });
  }

  if (!idleCheckId) {
    idleCheckId = setInterval(() => sweepIdle(), 1000);
  }
  if (!openPollId) {
    openPollId = setInterval(() => pollOpenFiles(), 2000);
    pollOpenFiles();
  }
}

export async function pauseMonitor() {
  monitorPaused.set(true);
}

export async function resumeMonitor() {
  monitorPaused.set(false);
  if (!watcherStarted) await startMonitor();
}

export async function stopMonitor() {
  try {
    await invoke("stop_watching");
  } catch {}
  watcherStarted = false;
  monitorStatus.set("idle");
  if (unlistenEvent) {
    unlistenEvent();
    unlistenEvent = null;
  }
  if (idleCheckId) {
    clearInterval(idleCheckId);
    idleCheckId = null;
  }
  if (openPollId) {
    clearInterval(openPollId);
    openPollId = null;
  }
  // Close any active sessions.
  const sessions = get(activeSessions);
  for (const [path] of sessions) {
    await closeActive(path, Date.now());
  }
}

function normPath(p) {
  if (!p) return "";
  return p.replace(/\\/g, "/").toLowerCase();
}

async function handleFileEvent(payload) {
  if (!payload || !payload.path) return;
  const path = payload.path;
  const map = get(ficheirosByPath);
  let meta = map.get(path);
  if (!meta) {
    // Fallback: case-insensitive / slash-agnostic match (Windows).
    const norm = normPath(path);
    for (const [k, v] of map) {
      if (normPath(k) === norm) { meta = v; break; }
    }
  }
  if (!meta) return; // ignore events for paths not in our scanned tree

  const now = payload.timestamp_ms || Date.now();
  const sessions = get(activeSessions);
  if (sessions.has(path)) {
    const s = sessions.get(path);
    s.lastActivityMs = now;
    activeSessions.set(new Map(sessions));
    return;
  }

  // Open new session.
  const ficheiroDb = await findFicheiroByCaminho(path);
  if (!ficheiroDb) return;
  const inicioIso = new Date(now).toISOString();
  const sessaoId = await dbOpenSessao(ficheiroDb.id, inicioIso);
  sessions.set(path, {
    sessaoId,
    ficheiroId: ficheiroDb.id,
    clienteId: meta.clienteId,
    clienteNome: meta.clienteNome,
    nome: meta.nome,
    caminho: path,
    startMs: now,
    lastActivityMs: now,
  });
  activeSessions.set(new Map(sessions));
  loadSessions();
}

async function pollOpenFiles() {
  if (openPollBusy) return;
  if (get(monitorPaused)) return;
  const map = get(ficheirosByPath);
  if (!map || map.size === 0) return;
  openPollBusy = true;
  try {
    const paths = Array.from(map.keys());
    let openPaths = [];
    try {
      openPaths = await invoke("query_open_files", { paths });
    } catch {
      return;
    }
    const now = Date.now();
    for (const p of openPaths) {
      await handleFileEvent({ path: p, timestamp_ms: now, kind: "open" });
    }
  } finally {
    openPollBusy = false;
  }
}

async function sweepIdle() {
  const thresholdMs = (get(idleThresholdMin) || 5) * 60_000;
  const now = Date.now();
  const sessions = get(activeSessions);
  let changed = false;
  for (const [path, s] of sessions) {
    if (now - s.lastActivityMs > thresholdMs) {
      await closeActive(path, s.lastActivityMs);
      changed = true;
    }
  }
  if (changed) loadSessions();
}

async function closeActive(path, endMs) {
  const sessions = get(activeSessions);
  const s = sessions.get(path);
  if (!s) return;
  const durSec = Math.max(0, Math.floor((endMs - s.startMs) / 1000));
  const rs = get(regras);
  const dr = get(defaultRule);
  const { valor } = priceFile(s.nome, durSec, rs, dr);
  const fimIso = new Date(endMs).toISOString();
  await dbCloseSessao(s.sessaoId, fimIso, durSec, valor);
  sessions.delete(path);
  activeSessions.set(new Map(sessions));
}

export async function forceCloseSession(path) {
  await closeActive(path, Date.now());
  await loadSessions();
}

// Manual hours correction (spec 6.4). Recalculates the session value from the
// new duration using the active rules, then reloads so file/cliente totals and
// the "por cobrar" balance cascade automatically.
export async function corrigirSessao(sessao, { inicioIso, fimIso, duracaoSeg }) {
  const rs = get(regras);
  const dr = get(defaultRule);
  const { valor } = priceFile(sessao.ficheiro_nome, duracaoSeg, rs, dr);
  await dbCorrigirSessao(sessao.id, { inicioIso, fimIso, duracaoSeg, valor });
  await loadSessions();
  return valor;
}

// Derived: rows for the Monitorização table.
export const monitorRows = derived(
  [ficheirosByPath, activeSessions, allSessions, regras, defaultRule],
  ([$map, $active, $all, $rs, $dr]) => {
    // Today key (UTC date string).
    const todayStr = new Date().toISOString().slice(0, 10);
    const byFicheiro = new Map();

    // Seed with files that have any session today.
    for (const s of $all) {
      if (!s.inicio?.startsWith(todayStr)) continue;
      const f = $map.get(s.caminho);
      if (!f) continue;
      const cur = byFicheiro.get(s.caminho) || {
        caminho: s.caminho,
        nome: s.ficheiro_nome || f.nome,
        clienteNome: s.cliente_nome || f.clienteNome,
        totalDiaSec: 0,
        estado: "fechado",
        sessaoActualSec: 0,
        startMs: null,
      };
      cur.totalDiaSec += s.duracao_seg || 0;
      byFicheiro.set(s.caminho, cur);
    }

    // Overlay active sessions.
    for (const [path, s] of $active) {
      const cur = byFicheiro.get(path) || {
        caminho: path,
        nome: s.nome,
        clienteNome: s.clienteNome,
        totalDiaSec: 0,
        estado: "fechado",
        sessaoActualSec: 0,
        startMs: null,
      };
      cur.estado = "aberto";
      cur.startMs = s.startMs;
      byFicheiro.set(path, cur);
    }

    // Compute regra label per row.
    return Array.from(byFicheiro.values()).map((r) => {
      const { regra, isDefault } = priceFile(r.nome, 0, $rs, $dr);
      const f = $map.get(r.caminho);
      const tipoDetetado = f?.tipoDetetado ?? null;
      return {
        ...r,
        tipo: tipoDetetado ?? (isDefault ? "—" : regra.palavra),
        regraLabel: regra.tipo === "hora" ? `${formatNum(regra.valor)} €/h` : `${formatNum(regra.valor)} € fixo`,
      };
    }).sort((a, b) => (b.estado === "aberto" ? 1 : 0) - (a.estado === "aberto" ? 1 : 0));
  }
);

function formatNum(n) {
  return Number(n).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
