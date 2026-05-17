<script>
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Button from "../components/Button.svelte";
  import Icon from "../components/Icon.svelte";
  import StatusPill from "../components/StatusPill.svelte";
  import CobrancaPill from "../components/CobrancaPill.svelte";
  import Segmented from "../components/Segmented.svelte";
  import Metric from "../components/Metric.svelte";
  import SessionEditDialog from "../components/SessionEditDialog.svelte";
  import { clientes } from "../stores/clientes.js";
  import { allSessions, activeSessions, corrigirSessao } from "../stores/sessoes.js";
  import { regras } from "../stores/regras.js";
  import { defaultRule } from "../stores/settings.js";
  import { clienteId, navigate, periodo, highlightFicheiro } from "../stores/navigation.js";
  import { fileCobrancaEstado } from "../lib/aggregations.js";
  import { tick } from "../stores/monitor.js";
  import { tick as svelteTick } from "svelte";
  import { fmtEuro, fmtNumber } from "../lib/format.js";
  import { fileAggregates, periodRange, inRange } from "../lib/aggregations.js";
  import { priceFile } from "../lib/pricing.js";

  const periodoOptions = [
    { value: "semana", label: "Semana" },
    { value: "mes", label: "Mês" },
    { value: "3mes", label: "3 meses" },
  ];

  // Set of expanded file caminhos
  let expanded = new Set();
  function toggleFile(caminho) {
    expanded = expanded.has(caminho)
      ? new Set([...expanded].filter((c) => c !== caminho))
      : new Set([...expanded, caminho]);
  }

  // Flash + scroll a file row when arriving from the header file search.
  const rowEls = new Map();
  let flashCaminho = null;
  function regRow(node, caminho) {
    rowEls.set(caminho, node);
    return { destroy() { rowEls.delete(caminho); } };
  }
  $: handleHighlight($highlightFicheiro, cliente);
  function handleHighlight(h, c) {
    if (!h || !c) return;
    if (!(c.ficheiros || []).some((f) => f.caminho === h)) return;
    highlightFicheiro.set(null);
    expanded = new Set([...expanded, h]);
    flashCaminho = h;
    svelteTick().then(() => {
      rowEls.get(h)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    setTimeout(() => { if (flashCaminho === h) flashCaminho = null; }, 2600);
  }

  $: cliente = $clientes.find((c) => c.id === $clienteId);
  $: range = periodRange($periodo);

  // Files with aggregated stats for the period
  $: ficheiros = cliente
    ? fileAggregates(
        $allSessions.filter((s) => s.cliente_id === cliente.id),
        cliente.ficheiros || [],
        $regras, $defaultRule, $periodo
      )
    : [];

  // All files, merging period agg data (0 for files with no sessions)
  $: allFicheiros = cliente
    ? (cliente.ficheiros || []).map((f) => {
        const agg = ficheiros.find((r) => r.caminho === f.caminho);
        return agg || { caminho: f.caminho, nome: f.nome, sessoes: 0, horas: 0, valor: 0, tipo: "—", regra: "" };
      })
    : [];

  // Sessions grouped by file caminho, sorted newest first
  $: sessoesByFile = (() => {
    if (!cliente) return new Map();
    const map = new Map();
    for (const s of $allSessions) {
      if (s.cliente_id !== cliente.id) continue;
      if (!map.has(s.caminho)) map.set(s.caminho, []);
      map.get(s.caminho).push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => (b.inicio > a.inicio ? 1 : -1));
    return map;
  })();

  // Recent sessions for right panel (period, newest first)
  $: sessoesPeriodo = cliente
    ? $allSessions
        .filter((s) => s.cliente_id === cliente.id && inRange(s.inicio, range.from, range.to))
        .sort((a, b) => (b.inicio > a.inicio ? 1 : -1))
        .slice(0, 40)
    : [];

  $: totalSessoes = ficheiros.reduce((a, f) => a + f.sessoes, 0);
  $: totalHoras = ficheiros.reduce((a, f) => a + f.horas, 0);
  $: totalValor = ficheiros.reduce((a, f) => a + f.valor, 0);

  // Cobrança balance for this client (all-time, not period-bound).
  $: clienteCob = (() => {
    let cobrado = 0, porCobrar = 0;
    if (cliente) {
      for (const s of $allSessions) {
        if (s.cliente_id !== cliente.id || s.estado !== "fechado") continue;
        if (s.cobranca_id != null) cobrado += s.valor || 0;
        else porCobrar += s.valor || 0;
      }
    }
    return { cobrado, porCobrar };
  })();
  function cobEstado(caminho) {
    return fileCobrancaEstado(sessoesByFile.get(caminho) || []).estado;
  }

  // Live session count for this client
  $: liveCount = $allSessions.filter(
    (s) => s.cliente_id === $clienteId && s.estado === "aberto"
  ).length;

  const initials = (n) =>
    n.split(/[\s_\-]+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  function fmtDateShort(iso) {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  function liveDuration(s) {
    void $tick;
    if (s.estado === "fechado") return fmtDuration(s.duracao_seg || 0);
    return fmtDuration(Math.max(0, Math.floor((Date.now() - new Date(s.inicio).getTime()) / 1000)));
  }
  function liveValor(s) {
    void $tick;
    if (s.estado === "fechado") return s.valor || 0;
    const sec = Math.max(0, Math.floor((Date.now() - new Date(s.inicio).getTime()) / 1000));
    return priceFile(s.ficheiro_nome, sec, $regras, $defaultRule).valor;
  }
  function hasLiveSession(caminho) {
    return (sessoesByFile.get(caminho) || []).some((s) => s.estado === "aberto");
  }

  // Manual hours correction (spec 6.4).
  let editSession = null;
  function openEdit(s) {
    if (!s || s.estado !== "fechado") return;
    editSession = s;
  }
  function priceFnFor(s) {
    return (sec) => priceFile(s.ficheiro_nome, sec, $regras, $defaultRule).valor;
  }
  function regraLabelFor(nome) {
    const { regra, isDefault } = priceFile(nome, 0, $regras, $defaultRule);
    return regra.tipo === "hora"
      ? `${fmtNumber(regra.valor, 2)} €/h${isDefault ? " (padrão)" : ""}`
      : `${fmtNumber(regra.valor, 2)} € fixo${isDefault ? " (padrão)" : ""}`;
  }
  async function onSaveCorrecao(e) {
    if (!editSession) return;
    await corrigirSessao(editSession, e.detail);
    editSession = null;
  }
</script>

{#if cliente}
  <!-- Back nav -->
  <button class="back-btn" on:click={() => navigate("clientes")}>
    <span style="transform:rotate(180deg); display:flex;"><Icon name="chevron" size={12} /></span>
    Clientes
  </button>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="avatar">{initials(cliente.nome)}</div>
      <div>
        <div class="kicker">Cliente</div>
        <h1 class="client-name">{cliente.nome}</h1>
        <div class="mono path-text">{cliente.pasta}</div>
      </div>
    </div>
    <div class="header-right">
      {#if liveCount > 0}
        <div class="live-badge">
          <span class="live-dot"></span>
          {liveCount} sessão{liveCount > 1 ? "ões" : ""} activa{liveCount > 1 ? "s" : ""}
        </div>
      {/if}
      {#if clienteCob.porCobrar > 0}
        <Button variant="primary" on:click={() => navigate("cobrancas")}>
          <Icon name="billing" size={14} /> Cobrar {fmtEuro(clienteCob.porCobrar, 0)}
        </Button>
      {/if}
      <Segmented bind:value={$periodo} options={periodoOptions} />
    </div>
  </div>

  <!-- Metrics -->
  <div class="metrics-row">
    <Metric label="Ficheiros" value={cliente.ficheiros?.length || 0} unit="na pasta" />
    <Metric label="Horas no período" value={fmtNumber(totalHoras, 1)} unit="h" />
    <Metric label="Cobrado" value={fmtNumber(clienteCob.cobrado / 1000, 2)} unit="k €" />
    <Metric label="Por cobrar" value={fmtNumber(clienteCob.porCobrar / 1000, 2)} unit="k €" accent />
  </div>

  <!-- Main grid -->
  <div class="main-grid">

    <!-- Left: Files with expandable session drill-down -->
    <Card title="Ficheiros">
      <div slot="action" style="display:flex; gap:8px; align-items:center;">
        <Badge tone="soft">{allFicheiros.length} total</Badge>
        {#if ficheiros.length > 0}
          <Badge tone="accent">{ficheiros.length} com actividade</Badge>
        {/if}
      </div>

      {#if allFicheiros.length === 0}
        <div class="empty-state">Nenhum ficheiro registado.</div>
      {:else}
        <div class="files-table">
          <!-- Column header -->
          <div class="files-header">
            <div class="col-file">Ficheiro</div>
            <div class="col-num">Sessões</div>
            <div class="col-num">Horas</div>
            <div class="col-num">Valor</div>
            <div class="col-cob">Cobrança</div>
            <div class="col-toggle"></div>
          </div>

          {#each allFicheiros as f (f.caminho)}
            {@const isExpanded = expanded.has(f.caminho)}
            {@const fileSessions = sessoesByFile.get(f.caminho) || []}
            {@const inPeriod = fileSessions.filter(s => inRange(s.inicio, range.from, range.to))}
            {@const hasData = f.sessoes > 0}
            {@const isLive = hasLiveSession(f.caminho)}

            <!-- File row -->
            <div
              use:regRow={f.caminho}
              class="file-row"
              class:has-data={hasData}
              class:is-expanded={isExpanded}
              class:flash={f.caminho === flashCaminho}
              on:click={() => hasData && toggleFile(f.caminho)}
              role={hasData ? "button" : undefined}
              tabindex={hasData ? 0 : undefined}
              on:keypress={(e) => e.key === "Enter" && hasData && toggleFile(f.caminho)}
            >
              <div class="col-file">
                <div class="file-icon" class:icon-live={isLive}>
                  <svg width="13" height="15" viewBox="0 0 12 14" fill="none" stroke="currentColor" stroke-width="1.4">
                    <path d="M2 1.5h5.5L10.5 4.5v8c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5v-11c0-.3.2-.5.5-.5z" />
                    <path d="M7 1.5v3h3" />
                  </svg>
                </div>
                <div class="file-info">
                  <div class="file-name">{f.nome}</div>
                  <div class="file-meta">
                    <Badge tone={f.tipo === "—" ? "soft" : "accent"}>{f.tipo}</Badge>
                    {#if f.regra}
                      <span class="mono regra-text">{f.regra}</span>
                    {/if}
                    {#if isLive}
                      <span class="live-dot" style="width:6px; height:6px;"></span>
                    {/if}
                  </div>
                </div>
              </div>
              <div class="col-num mono">
                {#if hasData}<span class="num-ink">{f.sessoes}</span>{:else}<span class="dim">—</span>{/if}
              </div>
              <div class="col-num mono">
                {#if hasData}<span class="num-ink">{fmtNumber(f.horas, 1)}</span>{:else}<span class="dim">—</span>{/if}
              </div>
              <div class="col-num mono">
                {#if hasData}<span class="num-ink bold">{fmtEuro(f.valor)}</span>{:else}<span class="dim">—</span>{/if}
              </div>
              <div class="col-cob">
                <CobrancaPill estado={cobEstado(f.caminho)} />
              </div>
              <div class="col-toggle">
                {#if hasData}
                  <span class="chevron-wrap" class:rotated={isExpanded}>
                    <Icon name="chevron-down" size={13} />
                  </span>
                {/if}
              </div>
            </div>

            <!-- Expanded sessions per file -->
            {#if isExpanded && hasData}
              <div class="drawer">
                <div class="drawer-header">
                  <span class="drawer-title">Histórico de sessões</span>
                  <Badge tone="soft">{inPeriod.length} no período · {fileSessions.length} total</Badge>
                </div>
                {#if fileSessions.length === 0}
                  <div class="empty-state small">Sem sessões registadas.</div>
                {:else}
                  <div class="drawer-list">
                    <div class="drawer-list-head">
                      <span class="dc-date">Data</span>
                      <span class="dc-time">Período</span>
                      <span class="dc-dur">Duração</span>
                      <span class="dc-val">Valor</span>
                      <span class="dc-st">Estado</span>
                      <span class="dc-edit"></span>
                    </div>
                    {#each fileSessions as s}
                      {@const inP = inRange(s.inicio, range.from, range.to)}
                      <div class="drawer-row" class:faded={!inP} class:drawer-live={s.estado === "aberto"}>
                        <span class="dc-date mono muted">{fmtDateShort(s.inicio)}</span>
                        <span class="dc-time mono muted">{fmtTime(s.inicio)}–{s.fim ? fmtTime(s.fim) : "…"}</span>
                        <span class="dc-dur mono" class:live-ink={s.estado === "aberto"}>
                          {liveDuration(s)}{#if s.corrigido_em}<span class="corr-mark" title="Sessão corrigida">*</span>{/if}
                        </span>
                        <span class="dc-val mono bold">
                          {#if s.estado === "aberto"}
                            <span class="live-ink">{fmtEuro(liveValor(s))}</span>
                          {:else}
                            {fmtEuro(s.valor || 0)}
                          {/if}
                        </span>
                        <span class="dc-st"><StatusPill estado={s.estado} /></span>
                        <span class="dc-edit">
                          {#if s.estado === "fechado"}
                            <button class="edit-btn" class:corr={s.corrigido_em} title="Corrigir horas da sessão" on:click|stopPropagation={() => openEdit(s)}>
                              <Icon name="edit" size={12} />
                            </button>
                          {/if}
                        </span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}

          <!-- Totals footer -->
          {#if ficheiros.length > 0}
            <div class="files-footer">
              <div class="col-file footer-label">Total do cliente</div>
              <div class="col-num mono footer-num">{totalSessoes}</div>
              <div class="col-num mono footer-num">{fmtNumber(totalHoras, 1)}</div>
              <div class="col-num mono footer-total">{fmtEuro(totalValor)}</div>
              <div class="col-cob"></div>
              <div class="col-toggle"></div>
            </div>
          {/if}
        </div>
      {/if}
    </Card>

    <!-- Right: Recent sessions across all files -->
    <Card title="Sessões recentes">
      <div slot="action"><Badge tone="soft">No período</Badge></div>
      {#if sessoesPeriodo.length === 0}
        <div class="empty-state">Sem sessões neste período.</div>
      {:else}
        <div class="sessions-panel">
          {#each sessoesPeriodo as s}
            <div class="rs-row" class:rs-live={s.estado === "aberto"}>
              <div class="rs-bar" class:rs-bar-live={s.estado === "aberto"}></div>
              <div class="rs-body">
                <div class="rs-top">
                  <span class="rs-file">{s.ficheiro_nome}</span>
                  <span class="mono rs-val bold">
                    {#if s.estado === "aberto"}
                      <span class="live-ink">{fmtEuro(liveValor(s))}</span>
                    {:else}
                      {fmtEuro(s.valor || 0)}
                    {/if}
                  </span>
                </div>
                <div class="rs-bottom">
                  <span class="mono rs-meta">{fmtDateShort(s.inicio)} · {fmtTime(s.inicio)}–{s.fim ? fmtTime(s.fim) : "…"}{#if s.corrigido_em} · corrigida{/if}</span>
                  <span class="mono rs-dur" class:live-ink={s.estado === "aberto"}>{liveDuration(s)}</span>
                </div>
              </div>
              {#if s.estado === "fechado"}
                <button class="rs-edit" class:corr={s.corrigido_em} title="Corrigir horas da sessão" on:click|stopPropagation={() => openEdit(s)}>
                  <Icon name="edit" size={12} />
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </Card>

  </div>

  <SessionEditDialog
    open={!!editSession}
    session={editSession}
    regraLabel={editSession ? regraLabelFor(editSession.ficheiro_nome) : ""}
    priceFn={editSession ? priceFnFor(editSession) : (sec) => 0}
    on:save={onSaveCorrecao}
    on:close={() => (editSession = null)}
  />

{:else}
  <div style="color:var(--text-3); font-size:13px;">
    Cliente não encontrado.
    <button on:click={() => navigate("clientes")} style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:13px; font-family:var(--font-ui);">Voltar</button>
  </div>
{/if}

<style>
  .back-btn {
    background: transparent;
    border: none;
    color: var(--text-3);
    font-size: 12px;
    padding: 0;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: var(--font-ui);
  }
  .back-btn:hover { color: var(--text-2); }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .header-left { display: flex; gap: 16px; align-items: center; }
  .header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
    letter-spacing: 0.5px;
    border: 1px solid var(--accent-line);
    flex-shrink: 0;
  }
  .kicker {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.6px;
    color: var(--text-3);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .client-name {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 26px;
    letter-spacing: -0.4px;
  }
  .path-text { font-size: 12px; color: var(--text-3); margin-top: 4px; }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--live-soft);
    border: 1px solid oklch(0.85 0.07 155);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    color: oklch(0.35 0.12 155);
  }

  /* Metrics */
  .metrics-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  /* Main grid */
  .main-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 14px;
    align-items: start;
  }

  /* Files table (custom flex layout for expandable rows) */
  .files-table { display: flex; flex-direction: column; }

  .files-header {
    display: flex;
    align-items: center;
    padding: 7px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-alt);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--text-3);
    text-transform: uppercase;
  }

  .col-file { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
  .col-num { width: 72px; text-align: right; flex-shrink: 0; }
  .col-cob { width: 96px; display: flex; justify-content: flex-end; flex-shrink: 0; padding-left: 10px; }
  .col-toggle { width: 28px; text-align: center; flex-shrink: 0; }

  .file-row {
    display: flex;
    align-items: center;
    padding: 9px 16px;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
    gap: 0;
  }
  .file-row:last-of-type { border-bottom: none; }
  .file-row.has-data { cursor: pointer; }
  .file-row.has-data:hover { background: var(--bg-alt); }
  .file-row.is-expanded { background: oklch(0.975 0.012 250 / 0.5); }
  .file-row.flash { animation: rowFlash 2.4s ease-out; }
  @keyframes rowFlash {
    0%, 18% { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
    100% { background: transparent; box-shadow: inset 3px 0 0 transparent; }
  }

  .file-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: var(--bg-alt);
    color: var(--text-3);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .file-icon.icon-live {
    background: var(--live-soft);
    color: oklch(0.42 0.12 155);
    border-color: oklch(0.85 0.07 155);
  }

  .file-info { min-width: 0; flex: 1; }
  .file-name {
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
  }
  .file-meta { margin-top: 3px; display: flex; gap: 6px; align-items: center; }
  .regra-text { font-size: 10.5px; color: var(--text-3); }

  .num-ink { color: var(--text-2); }
  .dim { color: var(--text-3); }
  .bold { font-weight: 600; color: var(--text) !important; }
  .muted { color: var(--text-2); }
  .live-ink { color: oklch(0.38 0.12 155); }

  .chevron-wrap {
    color: var(--text-3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.18s ease;
  }
  .chevron-wrap.rotated { transform: rotate(180deg); }

  /* Drawer (expanded session list per file) */
  .drawer {
    background: oklch(0.978 0.01 250 / 0.6);
    border-bottom: 1px solid var(--accent-line);
    border-left: 3px solid var(--accent-line);
  }
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 16px 7px 13px;
    border-bottom: 1px solid var(--accent-line);
  }
  .drawer-title {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .drawer-list { display: flex; flex-direction: column; }
  .drawer-list-head {
    display: flex;
    align-items: center;
    padding: 5px 16px 5px 13px;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 1px solid var(--border);
  }
  .drawer-row {
    display: flex;
    align-items: center;
    padding: 6px 16px 6px 13px;
    border-bottom: 1px solid var(--border);
    font-size: 11.5px;
    transition: background 0.1s;
  }
  .drawer-row:last-child { border-bottom: none; }
  .drawer-row:hover { background: oklch(0.975 0.01 250 / 0.6); }
  .drawer-row.faded { opacity: 0.4; }
  .drawer-row.drawer-live { background: oklch(0.975 0.04 155 / 0.4); }

  .dc-date { width: 68px; flex-shrink: 0; }
  .dc-time { flex: 1; }
  .dc-dur { width: 78px; text-align: right; }
  .dc-val { width: 90px; text-align: right; }
  .dc-st { width: 76px; display: flex; justify-content: flex-end; }
  .dc-edit { width: 34px; display: flex; justify-content: flex-end; flex-shrink: 0; }
  .corr-mark { color: oklch(0.6 0.12 60); font-weight: 700; margin-left: 1px; }

  .edit-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-3);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .edit-btn:hover { color: var(--text); border-color: var(--border-strong); background: var(--bg-alt); }
  .edit-btn.corr { color: oklch(0.55 0.12 60); border-color: oklch(0.85 0.07 60); }

  .rs-edit {
    align-self: center;
    margin-right: 12px;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-3);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .rs-edit:hover { color: var(--text); border-color: var(--border-strong); background: var(--bg-alt); }
  .rs-edit.corr { color: oklch(0.55 0.12 60); border-color: oklch(0.85 0.07 60); }

  /* Files footer */
  .files-footer {
    display: flex;
    align-items: center;
    padding: 11px 16px;
    border-top: 1px solid var(--border);
    background: var(--bg-alt);
    border-radius: 0 0 12px 12px;
  }
  .footer-label { font-size: 12px; font-weight: 600; color: var(--text-2); flex: 1; }
  .footer-num { font-size: 12px; color: var(--text-2); width: 72px; text-align: right; }
  .footer-total { font-size: 13px; font-weight: 700; color: var(--text); width: 72px; text-align: right; }

  /* Right panel */
  .sessions-panel {
    display: flex;
    flex-direction: column;
    max-height: 560px;
    overflow-y: auto;
  }
  .rs-row {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  .rs-row:last-child { border-bottom: none; }
  .rs-row:hover { background: var(--bg-alt); }
  .rs-row.rs-live { background: oklch(0.975 0.04 155 / 0.25); }

  .rs-bar { width: 3px; background: var(--border); flex-shrink: 0; }
  .rs-bar.rs-bar-live { background: var(--live); }

  .rs-body { flex: 1; padding: 8px 16px; min-width: 0; }
  .rs-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .rs-file {
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }
  .rs-val { font-size: 12px; flex-shrink: 0; }
  .rs-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 3px;
  }
  .rs-meta { font-size: 10.5px; color: var(--text-3); }
  .rs-dur { font-size: 10.5px; color: var(--text-3); }

  .empty-state {
    padding: 32px;
    text-align: center;
    color: var(--text-3);
    font-size: 12.5px;
  }
  .empty-state.small { padding: 12px 16px; }
</style>
