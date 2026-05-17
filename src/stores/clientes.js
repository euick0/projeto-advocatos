import { writable, derived, get } from "svelte/store";
import { scanRoot } from "../lib/tauri.js";
import { syncScan, listClientesWithFiles, clearScan, detectTipo, listSessoes } from "../lib/db.js";
import { rootFolder } from "./settings.js";
import { regras } from "./regras.js";

// Refresh allSessions via direct db read to avoid a circular import on sessoes.js.
async function reloadSessionsAfterScan() {
  const { allSessions } = await import("./sessoes.js");
  allSessions.set(await listSessoes());
}

export const clientes = writable([]);
export const scanning = writable(false);
export const scanError = writable(null);
export const lastScan = writable(null);

// Flat map: caminho -> { ficheiroId, clienteId, clienteNome, nome, tipoDetetado }
// Derives from both clientes and regras so tipoDetetado stays live when rules change.
export const ficheirosByPath = derived([clientes, regras], ([$cs, $regras]) => {
  const m = new Map();
  for (const c of $cs) {
    for (const f of c.ficheiros || []) {
      const { tipoDetetado } = detectTipo(f.nome, $regras);
      m.set(f.caminho, {
        ficheiroId: f.id,
        clienteId: c.id,
        clienteNome: c.nome,
        nome: f.nome,
        tipoDetetado,
      });
    }
  }
  return m;
});

export async function loadClientes() {
  const cs = await listClientesWithFiles();
  clientes.set(cs);
  return cs;
}

export async function rescan() {
  const root = get(rootFolder);
  if (!root) {
    scanError.set("Pasta raiz não definida.");
    return;
  }
  scanning.set(true);
  scanError.set(null);
  try {
    const { clientes: found, error } = await scanRoot(root);
    if (error) {
      scanError.set(error);
      scanning.set(false);
      return;
    }
    // Upsert (do NOT clear) so historical sessions stay intact even if a folder is removed.
    await syncScan(found, get(regras));
    await loadClientes();
    await reloadSessionsAfterScan();
    lastScan.set(new Date().toISOString());
  } catch (e) {
    scanError.set(String(e));
  } finally {
    scanning.set(false);
  }
}

export function clienteById(id) {
  return get(clientes).find((c) => c.id === id);
}
