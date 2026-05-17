// Match a filename to the highest-priority rule whose keyword appears in it.
// regras must be sorted ascending by `prioridade` (1 = highest).
// Returns { regra, valor, isDefault }.

export function priceFile(filename, durationSeconds, regras, defaultRule) {
  const lower = filename.toLowerCase();
  const match = regras.find((r) => lower.includes(r.palavra.toLowerCase()));
  const rule = match || defaultRule;
  const valor = computeValor(rule, durationSeconds);
  return { regra: rule, valor, isDefault: !match };
}

export function computeValor(rule, durationSeconds) {
  if (rule.tipo === "hora") {
    return Math.round(((durationSeconds / 3600) * rule.valor) * 100) / 100;
  }
  return Math.round(rule.valor * 100) / 100;
}
