import { derived } from "svelte/store";
import { clientes } from "./clientes.js";
import { regras } from "./regras.js";
import { detectTipo } from "../lib/db.js";

// Prebuilt flat index. Rebuilt only when clientes/regras change (not per keystroke).
// Each entry carries a lowercased haystack so query-time work is pure substring scans.
export const searchIndex = derived([clientes, regras], ([$cs, $regras]) => {
  const idx = [];
  for (const c of $cs) {
    const nomeLc = (c.nome || "").toLowerCase();
    idx.push({
      type: "cliente",
      clienteId: c.id,
      clienteNome: c.nome,
      label: c.nome,
      sub: c.pasta || "",
      caminho: null,
      hay: nomeLc + " " + (c.pasta || "").toLowerCase(),
    });
    for (const f of c.ficheiros || []) {
      const { tipoDetetado } = detectTipo(f.nome, $regras);
      idx.push({
        type: "ficheiro",
        clienteId: c.id,
        clienteNome: c.nome,
        ficheiroId: f.id,
        label: f.nome,
        sub: c.nome,
        tipo: tipoDetetado,
        caminho: f.caminho,
        hay:
          (f.nome || "").toLowerCase() +
          " " +
          nomeLc +
          " " +
          (tipoDetetado || "").toLowerCase(),
      });
    }
  }
  return idx;
});

const MAX_RESULTS = 12;

// Token-AND substring match. Score: lower = better.
// Bonus for prefix match on label, files slightly below clients on ties.
export function runSearch(index, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const out = [];
  for (const e of index) {
    let ok = true;
    let score = 0;
    for (const t of tokens) {
      const pos = e.hay.indexOf(t);
      if (pos === -1) {
        ok = false;
        break;
      }
      score += pos;
    }
    if (!ok) continue;
    const labelLc = e.label.toLowerCase();
    if (labelLc.startsWith(q)) score -= 1000;
    else if (labelLc.includes(q)) score -= 200;
    if (e.type === "ficheiro") score += 1;
    out.push({ entry: e, score });
  }
  out.sort((a, b) => a.score - b.score || a.entry.label.localeCompare(b.entry.label));
  return out.slice(0, MAX_RESULTS).map((r) => r.entry);
}
