import { writable } from "svelte/store";
import { marcarSessoesCobradas, listCobrancas } from "../lib/db.js";
import { loadSessions } from "./sessoes.js";

export const historico = writable([]);

export async function loadCobrancas() {
  const rows = await listCobrancas();
  historico.set(rows);
  return rows;
}

// sessaoIds: array of session ids.
// meta: { total (final), base, ajusteTotal, numFicheiros,
//         clientes:[{nome,ficheiros,base,ajuste,valor}], ajustes:{global,...} }
export async function confirmarCobranca(sessaoIds, meta) {
  await marcarSessoesCobradas(sessaoIds, meta);
  await loadSessions();
  await loadCobrancas();
}
