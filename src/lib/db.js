// SQLite wrapper. Lazy-loads Database. Falls back to localStorage-backed JSON store
// when running outside Tauri (vite dev in browser), so screens still work.

import { isTauri } from "./tauri.js";
import { priceFile } from "./pricing.js";

let _db = null;
let _loading = null;

async function loadDb() {
  if (_db) return _db;
  if (_loading) return _loading;
  _loading = (async () => {
    const { default: Database } = await import("@tauri-apps/plugin-sql");
    _db = await Database.load("sqlite:lextimer.db");
    return _db;
  })();
  return _loading;
}

// In-browser fallback store (dev only).
const LS_KEY = "lextimer.fallback";
const fallback = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    } catch {
      return {};
    }
  },
  save(s) {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  },
};

export async function getSetting(key, defaultValue = null) {
  if (!isTauri()) {
    const s = fallback.load();
    return s.settings?.[key] ?? defaultValue;
  }
  const db = await loadDb();
  const rows = await db.select("SELECT valor FROM settings WHERE chave = $1", [key]);
  return rows[0]?.valor ?? defaultValue;
}

export async function setSetting(key, value) {
  if (!isTauri()) {
    const s = fallback.load();
    s.settings = s.settings || {};
    s.settings[key] = String(value);
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  await db.execute(
    "INSERT INTO settings (chave, valor) VALUES ($1, $2) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
    [key, String(value)]
  );
}

export async function listRegras() {
  if (!isTauri()) {
    const s = fallback.load();
    return s.regras || [];
  }
  const db = await loadDb();
  return await db.select("SELECT id, palavra, tipo, valor, prioridade FROM regras ORDER BY prioridade ASC");
}

export async function saveRegrasOrdered(regras) {
  if (!isTauri()) {
    const s = fallback.load();
    s.regras = regras.map((r, i) => ({ ...r, prioridade: i + 1 }));
    fallback.save(s);
    return s.regras;
  }
  const db = await loadDb();

  const existing = await db.select("SELECT id FROM regras");
  const existingIds = new Set(existing.map((r) => r.id));
  const incomingIds = new Set(regras.filter((r) => r.id).map((r) => r.id));

  // Rows removed from the list — null FK refs in ficheiros before deleting.
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length) {
    const ph = toDelete.map((_, i) => `$${i + 1}`).join(",");
    await db.execute(
      `UPDATE ficheiros SET regra_id = NULL, tipo_detetado = NULL WHERE regra_id IN (${ph})`,
      toDelete
    );
    await db.execute(`DELETE FROM regras WHERE id IN (${ph})`, toDelete);
  }

  // Update existing rows in place (preserves id → FK refs stay valid).
  // Insert new rows (no id yet).
  for (let i = 0; i < regras.length; i++) {
    const r = regras[i];
    if (r.id && existingIds.has(r.id)) {
      await db.execute(
        "UPDATE regras SET palavra = $1, tipo = $2, valor = $3, prioridade = $4 WHERE id = $5",
        [r.palavra, r.tipo, r.valor, i + 1, r.id]
      );
    } else {
      await db.execute(
        "INSERT INTO regras (palavra, tipo, valor, prioridade) VALUES ($1, $2, $3, $4)",
        [r.palavra, r.tipo, r.valor, i + 1]
      );
    }
  }

  return await listRegras();
}



export function detectTipo(filename, regras) {
  if (!regras?.length) return { tipoDetetado: null, regraId: null };
  const lower = filename.toLowerCase();
  const match = regras.find((r) => lower.includes(r.palavra.toLowerCase()));
  return match ? { tipoDetetado: match.palavra, regraId: match.id } : { tipoDetetado: null, regraId: null };
}

// Re-run detection on all existing files in DB after rule changes.
export async function redetectTypes(regras) {
  if (!isTauri()) {
    const s = fallback.load();
    for (const c of s.clientes || []) {
      for (const f of c.ficheiros || []) {
        const { tipoDetetado, regraId } = detectTipo(f.nome, regras);
        f.tipo_detetado = tipoDetetado;
        f.regra_id = regraId;
      }
    }
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  const rows = await db.select("SELECT id, nome FROM ficheiros");
  if (!rows.length) return;
  // Group by result to batch UPDATEs.
  const groups = new Map();
  for (const row of rows) {
    const { tipoDetetado, regraId } = detectTipo(row.nome, regras);
    const key = `${tipoDetetado}|||${regraId}`;
    if (!groups.has(key)) groups.set(key, { tipoDetetado, regraId, ids: [] });
    groups.get(key).ids.push(row.id);
  }
  const ID_CHUNK = 499;
  for (const { tipoDetetado, regraId, ids } of groups.values()) {
    for (let i = 0; i < ids.length; i += ID_CHUNK) {
      const slice = ids.slice(i, i + ID_CHUNK);
      const ph = slice.map((_, k) => `$${k + 3}`).join(",");
      await db.execute(
        `UPDATE ficheiros SET tipo_detetado = $1, regra_id = $2 WHERE id IN (${ph})`,
        [tipoDetetado, regraId, ...slice]
      );
    }
  }
}

// Recalculate valor for all closed unbilled sessions after rule/tariff changes.
export async function recalcSessoes(regras, defaultRule) {
  if (!isTauri()) {
    const s = fallback.load();
    const ficheiroMap = new Map();
    for (const c of s.clientes || []) {
      for (const f of c.ficheiros || []) ficheiroMap.set(f.id, f.nome);
    }
    for (const ses of s.sessoes || []) {
      if (ses.estado !== "fechado" || ses.cobranca_id != null) continue;
      const nome = ficheiroMap.get(ses.ficheiro_id);
      if (!nome || ses.duracao_seg == null) continue;
      ses.valor = priceFile(nome, ses.duracao_seg, regras, defaultRule).valor;
    }
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  const rows = await db.select(
    `SELECT s.id, s.duracao_seg, f.nome FROM sessoes s JOIN ficheiros f ON s.ficheiro_id = f.id WHERE s.estado = 'fechado' AND s.cobranca_id IS NULL`
  );
  if (!rows.length) return;
  for (const row of rows) {
    if (row.duracao_seg == null) continue;
    const valor = priceFile(row.nome, row.duracao_seg, regras, defaultRule).valor;
    await db.execute("UPDATE sessoes SET valor = $1 WHERE id = $2", [valor, row.id]);
  }
}

// Cliente / ficheiro upsert from filesystem scan.
export async function syncScan(clientes, regras = []) {
  if (!isTauri()) {
    const s = fallback.load();
    s.clientes = clientes.map((c, i) => ({
      id: i + 1,
      nome: c.nome,
      pasta: c.pasta,
      ficheiros: c.ficheiros.map((f, j) => {
        const { tipoDetetado, regraId } = detectTipo(f.nome, regras);
        return {
          id: i * 10000 + j + 1,
          cliente_id: i + 1,
          nome: f.nome,
          caminho: f.caminho,
          tipo_detetado: tipoDetetado,
          regra_id: regraId,
        };
      }),
    }));
    fallback.save(s);
    return s.clientes;
  }
  const db = await loadDb();
  if (!clientes.length) return await listClientesWithFiles();

  // Batched multi-row upserts: one IPC call per chunk instead of per row.
  // No manual BEGIN/COMMIT — tauri-plugin-sql pool can't guarantee same conn
  // across calls. Upserts are idempotent, so partial failure is safe to retry.

  // Bulk upsert clientes (chunk to stay well under sqlite param cap).
  const CCHUNK = 400; // 400 * 2 = 800 params
  for (let i = 0; i < clientes.length; i += CCHUNK) {
    const slice = clientes.slice(i, i + CCHUNK);
    const params = [];
    const values = slice
      .map((c, j) => {
        params.push(c.nome, c.pasta);
        return `($${j * 2 + 1}, $${j * 2 + 2})`;
      })
      .join(",");
    await db.execute(
      `INSERT INTO clientes (nome, pasta) VALUES ${values} ON CONFLICT(nome) DO UPDATE SET pasta = excluded.pasta`,
      params
    );
  }

  // Fetch ids in chunks.
  const idMap = new Map();
  const nomes = clientes.map((c) => c.nome);
  const NCHUNK = 500;
  for (let i = 0; i < nomes.length; i += NCHUNK) {
    const slice = nomes.slice(i, i + NCHUNK);
    const ph = slice.map((_, k) => `$${k + 1}`).join(",");
    const rows = await db.select(
      `SELECT id, nome FROM clientes WHERE nome IN (${ph})`,
      slice
    );
    for (const r of rows) idMap.set(r.nome, r.id);
  }

  // Flatten ficheiros with resolved cliente id.
  const all = [];
  for (const c of clientes) {
    const cid = idMap.get(c.nome);
    if (cid == null) continue;
    for (const f of c.ficheiros) {
      const { tipoDetetado, regraId } = detectTipo(f.nome, regras);
      all.push([cid, f.caminho, f.nome, tipoDetetado, regraId]);
    }
  }

  // Bulk upsert ficheiros. 5 params per row → chunk at 180 (900 params).
  const FCHUNK = 180;
  for (let i = 0; i < all.length; i += FCHUNK) {
    const slice = all.slice(i, i + FCHUNK);
    const params = [];
    const values = slice
      .map((row, j) => {
        params.push(row[0], row[1], row[2], row[3], row[4]);
        return `($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}, $${j * 5 + 5})`;
      })
      .join(",");
    await db.execute(
      `INSERT INTO ficheiros (cliente_id, caminho, nome, tipo_detetado, regra_id) VALUES ${values} ON CONFLICT(caminho) DO UPDATE SET nome = excluded.nome, cliente_id = excluded.cliente_id, tipo_detetado = excluded.tipo_detetado, regra_id = excluded.regra_id`,
      params
    );
  }

  return await listClientesWithFiles();
}

export async function listClientesWithFiles() {
  if (!isTauri()) {
    const s = fallback.load();
    return s.clientes || [];
  }
  const db = await loadDb();
  const clientes = await db.select("SELECT id, nome, pasta FROM clientes ORDER BY nome");
  const ficheiros = await db.select("SELECT id, cliente_id, caminho, nome, tipo_detetado FROM ficheiros");
  return clientes.map((c) => ({
    ...c,
    ficheiros: ficheiros.filter((f) => f.cliente_id === c.id),
  }));
}

export async function findFicheiroByCaminho(caminho) {
  if (!isTauri()) {
    const s = fallback.load();
    for (const c of s.clientes || []) {
      const f = c.ficheiros.find((x) => x.caminho === caminho);
      if (f) return { ...f, cliente_id: c.id };
    }
    return null;
  }
  const db = await loadDb();
  const rows = await db.select("SELECT id, cliente_id, caminho, nome FROM ficheiros WHERE caminho = $1", [caminho]);
  return rows[0] || null;
}

export async function openSessao(ficheiroId, inicioIso) {
  if (!isTauri()) {
    const s = fallback.load();
    s.sessoes = s.sessoes || [];
    const id = (s.sessoes.at(-1)?.id || 0) + 1;
    s.sessoes.push({ id, ficheiro_id: ficheiroId, inicio: inicioIso, fim: null, duracao_seg: null, valor: null, estado: "aberto", cobranca_id: null });
    fallback.save(s);
    return id;
  }
  const db = await loadDb();
  const r = await db.execute(
    "INSERT INTO sessoes (ficheiro_id, inicio, estado) VALUES ($1, $2, 'aberto')",
    [ficheiroId, inicioIso]
  );
  return r.lastInsertId;
}

export async function closeSessao(sessaoId, fimIso, duracaoSeg, valor) {
  if (!isTauri()) {
    const s = fallback.load();
    const ses = (s.sessoes || []).find((x) => x.id === sessaoId);
    if (ses) {
      ses.fim = fimIso;
      ses.duracao_seg = duracaoSeg;
      ses.valor = valor;
      ses.estado = "fechado";
    }
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  await db.execute(
    "UPDATE sessoes SET fim = $1, duracao_seg = $2, valor = $3, estado = 'fechado' WHERE id = $4",
    [fimIso, duracaoSeg, valor, sessaoId]
  );
}

// Manual hours correction (spec 6.4). Updates inicio/fim/duracao_seg/valor of a
// closed session, preserving the original values for audit the first time it is
// corrected and stamping the correction timestamp.
export async function corrigirSessao(sessaoId, { inicioIso, fimIso, duracaoSeg, valor }) {
  const nowIso = new Date().toISOString();
  if (!isTauri()) {
    const s = fallback.load();
    const ses = (s.sessoes || []).find((x) => x.id === sessaoId);
    if (!ses || ses.estado !== "fechado") return;
    if (ses.corrigido_em == null) {
      ses.inicio_original = ses.inicio;
      ses.fim_original = ses.fim;
      ses.duracao_seg_original = ses.duracao_seg;
      ses.valor_original = ses.valor;
    }
    ses.inicio = inicioIso;
    ses.fim = fimIso;
    ses.duracao_seg = duracaoSeg;
    ses.valor = valor;
    ses.corrigido_em = nowIso;
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  const rows = await db.select(
    "SELECT inicio, fim, duracao_seg, valor, corrigido_em, estado FROM sessoes WHERE id = $1",
    [sessaoId]
  );
  const cur = rows[0];
  if (!cur || cur.estado !== "fechado") return;
  if (cur.corrigido_em == null) {
    await db.execute(
      "UPDATE sessoes SET inicio_original = $1, fim_original = $2, duracao_seg_original = $3, valor_original = $4 WHERE id = $5",
      [cur.inicio, cur.fim, cur.duracao_seg, cur.valor, sessaoId]
    );
  }
  await db.execute(
    "UPDATE sessoes SET inicio = $1, fim = $2, duracao_seg = $3, valor = $4, corrigido_em = $5 WHERE id = $6",
    [inicioIso, fimIso, duracaoSeg, valor, nowIso, sessaoId]
  );
}

export async function listSessoes(filter = {}) {
  if (!isTauri()) {
    const s = fallback.load();
    return s.sessoes || [];
  }
  const db = await loadDb();
  let q = "SELECT s.id, s.ficheiro_id, s.inicio, s.fim, s.duracao_seg, s.valor, s.estado, s.cobranca_id, s.corrigido_em, s.duracao_seg_original, s.valor_original, f.nome as ficheiro_nome, f.caminho, f.cliente_id, c.nome as cliente_nome FROM sessoes s JOIN ficheiros f ON s.ficheiro_id = f.id JOIN clientes c ON f.cliente_id = c.id";
  const where = [];
  const params = [];
  if (filter.from) { params.push(filter.from); where.push(`s.inicio >= $${params.length}`); }
  if (filter.to)   { params.push(filter.to);   where.push(`s.inicio <= $${params.length}`); }
  if (filter.clienteId) { params.push(filter.clienteId); where.push(`f.cliente_id = $${params.length}`); }
  if (where.length) q += " WHERE " + where.join(" AND ");
  q += " ORDER BY s.inicio DESC";
  return await db.select(q, params);
}

export async function listSessoesByCliente(clienteId, filter = {}) {
  return listSessoes({ ...filter, clienteId });
}

export async function listSessoesByFicheiro(ficheiroId) {
  if (!isTauri()) {
    const s = fallback.load();
    return (s.sessoes || []).filter((x) => x.ficheiro_id === ficheiroId);
  }
  const db = await loadDb();
  return await db.select(
    "SELECT s.id, s.ficheiro_id, s.inicio, s.fim, s.duracao_seg, s.valor, s.estado, s.cobranca_id, s.corrigido_em, s.duracao_seg_original, s.valor_original, f.nome as ficheiro_nome, f.caminho, f.cliente_id, c.nome as cliente_nome FROM sessoes s JOIN ficheiros f ON s.ficheiro_id = f.id JOIN clientes c ON f.cliente_id = c.id WHERE s.ficheiro_id = $1 ORDER BY s.inicio DESC",
    [ficheiroId]
  );
}

// Single-client totals for detail view.
export async function getClienteTotals(clienteId) {
  if (!isTauri()) {
    const s = fallback.load();
    const ficheiros = (s.clientes || []).find((c) => c.id === clienteId)?.ficheiros || [];
    const fids = new Set(ficheiros.map((f) => f.id));
    const closed = (s.sessoes || []).filter((x) => fids.has(x.ficheiro_id) && x.estado === "fechado");
    return {
      sessoes: closed.length,
      horas: closed.reduce((a, x) => a + (x.duracao_seg || 0) / 3600, 0),
      valor: closed.reduce((a, x) => a + (x.valor || 0), 0),
    };
  }
  const db = await loadDb();
  const rows = await db.select(
    "SELECT COUNT(*) as sessoes, COALESCE(SUM(s.duracao_seg), 0) as total_seg, COALESCE(SUM(s.valor), 0) as total_valor FROM sessoes s JOIN ficheiros f ON s.ficheiro_id = f.id WHERE f.cliente_id = $1 AND s.estado = 'fechado'",
    [clienteId]
  );
  const r = rows[0] || { sessoes: 0, total_seg: 0, total_valor: 0 };
  return { sessoes: Number(r.sessoes), horas: r.total_seg / 3600, valor: r.total_valor };
}

// All-clients totals in one query — used for dashboard aggregations.
export async function listAllClienteTotals(filter = {}) {
  if (!isTauri()) {
    const s = fallback.load();
    return (s.clientes || []).map((c) => {
      const fids = new Set((c.ficheiros || []).map((f) => f.id));
      const closed = (s.sessoes || []).filter((x) => fids.has(x.ficheiro_id) && x.estado === "fechado");
      return {
        cliente_id: c.id,
        cliente_nome: c.nome,
        sessoes: closed.length,
        horas: closed.reduce((a, x) => a + (x.duracao_seg || 0) / 3600, 0),
        valor: closed.reduce((a, x) => a + (x.valor || 0), 0),
      };
    });
  }
  const db = await loadDb();
  let q = "SELECT c.id as cliente_id, c.nome as cliente_nome, COUNT(s.id) as sessoes, COALESCE(SUM(s.duracao_seg), 0) as total_seg, COALESCE(SUM(s.valor), 0) as total_valor FROM clientes c LEFT JOIN ficheiros f ON f.cliente_id = c.id LEFT JOIN sessoes s ON s.ficheiro_id = f.id AND s.estado = 'fechado'";
  const where = [];
  const params = [];
  if (filter.from) { params.push(filter.from); where.push(`s.inicio >= $${params.length}`); }
  if (filter.to)   { params.push(filter.to);   where.push(`s.inicio <= $${params.length}`); }
  if (where.length) q += " WHERE " + where.join(" AND ");
  q += " GROUP BY c.id, c.nome ORDER BY c.nome";
  const rows = await db.select(q, params);
  return rows.map((r) => ({ ...r, sessoes: Number(r.sessoes), horas: r.total_seg / 3600, valor: r.total_valor }));
}

export async function deleteCliente(clienteId) {
  if (!isTauri()) {
    const s = fallback.load();
    s.clientes = (s.clientes || []).filter((c) => c.id !== clienteId);
    s.sessoes = (s.sessoes || []).filter((ss) => {
      return true;
    });
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  await db.execute("DELETE FROM clientes WHERE id = $1", [clienteId]);
}

export async function deleteClientes(ids) {
  if (!ids?.length) return;
  if (!isTauri()) {
    const s = fallback.load();
    const set = new Set(ids);
    s.clientes = (s.clientes || []).filter((c) => !set.has(c.id));
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  await db.execute(`DELETE FROM clientes WHERE id IN (${placeholders})`, ids);
}

// ── Cobranças ──────────────────────────────────────────────

// Mark a set of closed sessions as cobradas: create a cobranca row and
// stamp cobranca_id on every selected session.
export async function marcarSessoesCobradas(sessaoIds, meta) {
  if (!sessaoIds?.length) return null;
  const nowIso = new Date().toISOString();
  if (!isTauri()) {
    const s = fallback.load();
    s.cobrancas = s.cobrancas || [];
    const id = (s.cobrancas.at(-1)?.id || 0) + 1;
    s.cobrancas.push({
      id,
      data: nowIso,
      total: meta.total,
      base: meta.base ?? meta.total,
      ajuste_total: meta.ajusteTotal ?? 0,
      ajustes_json: JSON.stringify(meta.ajustes || {}),
      num_ficheiros: meta.numFicheiros,
      num_sessoes: sessaoIds.length,
      clientes_json: JSON.stringify(meta.clientes || []),
    });
    const set = new Set(sessaoIds);
    for (const ses of s.sessoes || []) {
      if (set.has(ses.id)) ses.cobranca_id = id;
    }
    fallback.save(s);
    return id;
  }
  const db = await loadDb();
  const r = await db.execute(
    "INSERT INTO cobrancas (data, total, base, ajuste_total, ajustes_json, num_ficheiros, num_sessoes, clientes_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [
      nowIso,
      meta.total,
      meta.base ?? meta.total,
      meta.ajusteTotal ?? 0,
      JSON.stringify(meta.ajustes || {}),
      meta.numFicheiros,
      sessaoIds.length,
      JSON.stringify(meta.clientes || []),
    ]
  );
  const cobrancaId = r.lastInsertId;
  const CHUNK = 400;
  for (let i = 0; i < sessaoIds.length; i += CHUNK) {
    const slice = sessaoIds.slice(i, i + CHUNK);
    const ph = slice.map((_, k) => `$${k + 2}`).join(",");
    await db.execute(
      `UPDATE sessoes SET cobranca_id = $1 WHERE id IN (${ph})`,
      [cobrancaId, ...slice]
    );
  }
  return cobrancaId;
}

export async function listCobrancas() {
  let rows;
  if (!isTauri()) {
    const s = fallback.load();
    rows = [...(s.cobrancas || [])].sort((a, b) => (b.data > a.data ? 1 : -1));
  } else {
    const db = await loadDb();
    rows = await db.select(
      "SELECT id, data, total, base, ajuste_total, ajustes_json, num_ficheiros, num_sessoes, clientes_json FROM cobrancas ORDER BY data DESC"
    );
  }
  return rows.map((r) => {
    let clientes = [];
    try { clientes = JSON.parse(r.clientes_json || "[]"); } catch { clientes = []; }
    let ajustes = {};
    try { ajustes = JSON.parse(r.ajustes_json || "{}"); } catch { ajustes = {}; }
    return {
      ...r,
      clientes,
      ajustes,
      base: r.base ?? r.total,
      ajuste_total: r.ajuste_total ?? 0,
    };
  });
}

export async function getDbInfo() {
  const counts = { sessoes: 0, ficheiros: 0, clientes: 0, cobrancas: 0 };
  if (!isTauri()) {
    const s = fallback.load();
    counts.clientes = (s.clientes || []).length;
    counts.ficheiros = (s.clientes || []).reduce((a, c) => a + (c.ficheiros?.length || 0), 0);
    counts.sessoes = (s.sessoes || []).length;
    counts.cobrancas = (s.cobrancas || []).length;
    return { caminho: "localStorage (modo dev)", tamanho: "—", registos: counts };
  }
  const db = await loadDb();
  const q = async (sql) => Number((await db.select(sql))[0]?.n || 0);
  counts.sessoes = await q("SELECT COUNT(*) as n FROM sessoes");
  counts.ficheiros = await q("SELECT COUNT(*) as n FROM ficheiros");
  counts.clientes = await q("SELECT COUNT(*) as n FROM clientes");
  counts.cobrancas = await q("SELECT COUNT(*) as n FROM cobrancas");
  let caminho = "lextimer.db";
  let tamanho = "—";
  try {
    const { invoke } = await import("./tauri.js");
    const info = await invoke("db_info");
    caminho = info.caminho;
    tamanho = fmtBytes(info.tamanho_bytes);
  } catch {}
  return { caminho, tamanho, registos: counts };
}

function fmtBytes(n) {
  n = Number(n) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export async function clearScan() {
  if (!isTauri()) {
    const s = fallback.load();
    s.clientes = [];
    fallback.save(s);
    return;
  }
  const db = await loadDb();
  await db.execute("DELETE FROM ficheiros");
  await db.execute("DELETE FROM clientes");
}
