import { priceFile } from "./pricing.js";

export function periodRange(periodo) {
  if (periodo && typeof periodo === "object") {
    const to = new Date(periodo.to);
    to.setHours(23, 59, 59, 999);
    return { from: new Date(periodo.from).toISOString(), to: to.toISOString() };
  }
  const now = new Date();
  const start = new Date(now);
  if (periodo === "semana") {
    start.setDate(now.getDate() - 7);
  } else if (periodo === "mes") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (periodo === "3mes") {
    start.setMonth(now.getMonth() - 3);
  } else {
    start.setMonth(now.getMonth() - 3);
  }
  return { from: start.toISOString(), to: new Date(now.getTime() + 86400000).toISOString() };
}

export function inRange(iso, from, to) {
  return iso >= from && iso <= to;
}

// Returns aggregations per cliente for the period.
// sessions: rows from db listSessoes (already joined with cliente)
// clientes: list of clientes with .ficheiros
export function aggregateClientes(clientes, sessions, regras, defaultRule, period) {
  const { from, to } = periodRange(period);
  const byClienteId = new Map();
  for (const c of clientes) {
    byClienteId.set(c.id, {
      id: c.id,
      nome: c.nome,
      pasta: c.pasta,
      ficheiros: c.ficheiros?.length || 0,
      horas: 0,
      valor: 0,
      sessoes: 0,
      tipos: new Map(),
      // Cobrança balance — running, not period-bound (per spec 8.4).
      valorCobrado: 0,
      valorPorCobrar: 0,
      _porCobrarFiles: new Set(),
    });
  }
  for (const s of sessions) {
    if (s.estado !== "fechado") continue;
    const agg = byClienteId.get(s.cliente_id);
    if (!agg) continue;
    const valor = s.valor || 0;
    if (s.cobranca_id != null) {
      agg.valorCobrado += valor;
    } else {
      agg.valorPorCobrar += valor;
      if (valor > 0) agg._porCobrarFiles.add(s.caminho);
    }
    if (!inRange(s.inicio, from, to)) continue;
    const sec = s.duracao_seg || 0;
    agg.horas += sec / 3600;
    agg.valor += valor;
    agg.sessoes += 1;
    const { regra, isDefault } = priceFile(s.ficheiro_nome, sec, regras, defaultRule);
    const tipo = isDefault ? "—" : regra.palavra;
    agg.tipos.set(tipo, (agg.tipos.get(tipo) || 0) + 1);
  }
  return Array.from(byClienteId.values()).map((c) => ({
    ...c,
    tipoFreq: topKey(c.tipos),
    ficheirosPorCobrar: c._porCobrarFiles.size,
  }));
}

function topKey(m) {
  let best = null;
  let bestCount = -1;
  for (const [k, v] of m) if (v > bestCount) { best = k; bestCount = v; }
  return best || "—";
}

export function aggregateTotals(aggs) {
  return aggs.reduce(
    (a, c) => ({
      horas: a.horas + c.horas,
      valor: a.valor + c.valor,
      ficheiros: a.ficheiros + c.ficheiros,
      sessoes: a.sessoes + c.sessoes,
      valorCobrado: a.valorCobrado + (c.valorCobrado || 0),
      valorPorCobrar: a.valorPorCobrar + (c.valorPorCobrar || 0),
      ficheirosPorCobrar: a.ficheirosPorCobrar + (c.ficheirosPorCobrar || 0),
    }),
    { horas: 0, valor: 0, ficheiros: 0, sessoes: 0, valorCobrado: 0, valorPorCobrar: 0, ficheirosPorCobrar: 0 }
  );
}

// Cobrança state for one file from its sessions: por-cobrar | cobrado | parcial.
export function fileCobrancaEstado(sessions) {
  let cobrado = 0;
  let porCobrar = 0;
  for (const s of sessions) {
    if (s.estado !== "fechado") continue;
    if (s.cobranca_id != null) cobrado += s.valor || 0;
    else porCobrar += s.valor || 0;
  }
  if (porCobrar > 0 && cobrado > 0) return { estado: "parcial", cobrado, porCobrar };
  if (porCobrar > 0) return { estado: "por-cobrar", cobrado, porCobrar };
  if (cobrado > 0) return { estado: "cobrado", cobrado, porCobrar };
  return { estado: "cobrado", cobrado: 0, porCobrar: 0 };
}

// Pending (uncharged closed) sessions grouped by ficheiro, then by cliente.
// Used by the Cobranças screen.
export function pendentesByCliente(sessions, clientes) {
  const clienteNome = new Map(clientes.map((c) => [c.id, c.nome]));
  const byFile = new Map();
  for (const s of sessions) {
    if (s.estado !== "fechado" || s.cobranca_id != null) continue;
    const valor = s.valor || 0;
    if (valor <= 0) continue;
    let f = byFile.get(s.caminho);
    if (!f) {
      f = {
        id: s.caminho,
        caminho: s.caminho,
        ficheiro: s.ficheiro_nome,
        clienteId: s.cliente_id,
        cliente: s.cliente_nome || clienteNome.get(s.cliente_id) || "—",
        horas: 0,
        valor: 0,
        sessaoIds: [],
      };
      byFile.set(s.caminho, f);
    }
    f.horas += (s.duracao_seg || 0) / 3600;
    f.valor += valor;
    f.sessaoIds.push(s.id);
  }
  const byCliente = new Map();
  for (const f of byFile.values()) {
    if (!byCliente.has(f.clienteId)) {
      byCliente.set(f.clienteId, { id: f.clienteId, nome: f.cliente, ficheiros: 0, horas: 0, valor: 0, items: [] });
    }
    const g = byCliente.get(f.clienteId);
    g.ficheiros += 1;
    g.horas += f.horas;
    g.valor += f.valor;
    g.items.push(f);
  }
  return Array.from(byCliente.values())
    .map((g) => ({ ...g, items: g.items.sort((a, b) => b.valor - a.valor) }))
    .sort((a, b) => b.valor - a.valor);
}

// Breakdown for chart — daily for short periods (≤10 days), weekly otherwise.
export function weeklyBreakdown(sessions, periodo) {
  const { from, to } = periodRange(periodo);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = Math.round((toDate - fromDate) / 86400000);
  const useDays = diffDays <= 10;

  const buckets = useDays
    ? _buildDayBuckets(fromDate, toDate)
    : _buildWeekBuckets(fromDate, toDate);

  for (const s of sessions) {
    if (s.estado !== "fechado") continue;
    const t = new Date(s.inicio);
    for (const b of buckets) {
      if (t >= b.start && t <= b.end) { b.valor += s.valor || 0; break; }
    }
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const todayStr = startOfDay(new Date()).getTime();
  return buckets.map((b, i) => ({
    label: useDays ? dayNames[b.start.getDay()] : `S${weekNumber(b.end)}`,
    semana: useDays
      ? `${b.start.getDate()} ${monthShort(b.start)}`
      : `${b.start.getDate()} ${monthShort(b.start)} – ${b.end.getDate()} ${monthShort(b.end)}`,
    valor: Math.round(b.valor),
    current: useDays
      ? startOfDay(b.start).getTime() === todayStr
      : i === buckets.length - 1,
  }));
}

function _buildDayBuckets(from, to) {
  const buckets = [];
  let d = startOfDay(from);
  const limit = endOfDay(to);
  while (d <= limit && buckets.length < 31) {
    buckets.push({ start: new Date(d), end: endOfDay(new Date(d)), valor: 0 });
    d = new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return buckets;
}

function _buildWeekBuckets(from, to) {
  const buckets = [];
  let end = endOfDay(to);
  while (end > from && buckets.length < 52) {
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const actualStart = start < from ? startOfDay(from) : start;
    buckets.unshift({ start: actualStart, end: new Date(end), valor: 0 });
    end = new Date(end);
    end.setDate(end.getDate() - 7);
    end.setHours(23, 59, 59, 999);
  }
  return buckets;
}

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function weekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
}
function monthShort(d) {
  return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][d.getMonth()];
}

// Type distribution for dashboard pie/bar.
export function typeDistribution(sessions, regras, defaultRule, period) {
  const { from, to } = periodRange(period);
  const byTipo = new Map();
  let total = 0;
  for (const s of sessions) {
    if (s.estado !== "fechado") continue;
    if (!inRange(s.inicio, from, to)) continue;
    const { regra, isDefault } = priceFile(s.ficheiro_nome, s.duracao_seg || 0, regras, defaultRule);
    const k = isDefault ? "Outros" : capitalize(regra.palavra);
    byTipo.set(k, (byTipo.get(k) || 0) + (s.valor || 0));
    total += s.valor || 0;
  }
  const arr = Array.from(byTipo.entries()).map(([tipo, valor]) => ({
    tipo, valor, pct: total ? Math.round((valor / total) * 100) : 0,
  }));
  arr.sort((a, b) => b.valor - a.valor);
  return arr;
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

export function fileAggregates(sessions, ficheiros, regras, defaultRule, period) {
  const { from, to } = periodRange(period);
  const byPath = new Map();
  for (const f of ficheiros) {
    byPath.set(f.caminho, {
      caminho: f.caminho,
      nome: f.nome,
      sessoes: 0,
      horas: 0,
      valor: 0,
    });
  }
  for (const s of sessions) {
    if (!inRange(s.inicio, from, to)) continue;
    if (s.estado !== "fechado") continue;
    const r = byPath.get(s.caminho);
    if (!r) continue;
    r.sessoes += 1;
    r.horas += (s.duracao_seg || 0) / 3600;
    r.valor += s.valor || 0;
  }
  return Array.from(byPath.values())
    .map((r) => {
      const { regra, isDefault } = priceFile(r.nome, 0, regras, defaultRule);
      return {
        ...r,
        tipo: isDefault ? "—" : capitalize(regra.palavra),
        regra: regra.tipo === "hora"
          ? `${formatNum(regra.valor)} €/h${isDefault ? " (padrão)" : ""}`
          : `${formatNum(regra.valor)} € fixo${isDefault ? " (padrão)" : ""}`,
      };
    })
    .filter((r) => r.sessoes > 0)
    .sort((a, b) => b.valor - a.valor);
}

function formatNum(n) {
  return Number(n).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
