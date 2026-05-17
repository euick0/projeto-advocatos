// Billing adjustments (spec 8.2). An ajuste is { tipo, valor } where
// tipo ∈ "fixo" (€) | "hora" (€/h) | "pct" (%). valor carries the sign.
import { fmtEuro } from "./format.js";

// Returns the signed € delta this adjustment applies over `base` for `horas`.
export function applyAjuste(ajuste, base, horas) {
  if (!ajuste || !ajuste.valor) return 0;
  if (ajuste.tipo === "fixo") return ajuste.valor;
  if (ajuste.tipo === "hora") return (horas || 0) * ajuste.valor;
  if (ajuste.tipo === "pct") return (base * ajuste.valor) / 100;
  return 0;
}

// Compact label for a chip/inline display, e.g. "+50,00 €", "−10,00 €/h", "+15%".
export function fmtAjusteCompact(ajuste) {
  if (!ajuste || !ajuste.valor) return "";
  const abs = Math.abs(ajuste.valor);
  const sign = ajuste.valor < 0 ? "−" : "+";
  if (ajuste.tipo === "fixo") return `${sign}${fmtEuro(abs)}`;
  if (ajuste.tipo === "hora") return `${sign}${fmtEuro(abs)}/h`;
  if (ajuste.tipo === "pct")
    return `${sign}${(abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1)).replace(".", ",")}%`;
  return "";
}
