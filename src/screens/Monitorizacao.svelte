<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Button from "../components/Button.svelte";
  import Table from "../components/Table.svelte";
  import StatusPill from "../components/StatusPill.svelte";
  import Icon from "../components/Icon.svelte";
  import SessionEditDialog from "../components/SessionEditDialog.svelte";
  import { rootFolder, idleThresholdMin, defaultRule } from "../stores/settings.js";
  import {
    monitorPaused, monitorStatus, monitorError, monitorRows, activeSessions, allSessions,
    pauseMonitor, resumeMonitor, startMonitor, corrigirSessao,
  } from "../stores/sessoes.js";
  import { regras } from "../stores/regras.js";
  import { tick } from "../stores/monitor.js";
  import { fmtSecondsAsHHMMSS, fmtSecondsAsHM, fmtNumber } from "../lib/format.js";
  import { priceFile } from "../lib/pricing.js";

  $: rows = $monitorRows;
  $: openCount = $activeSessions.size;
  $: closedCount = rows.filter((r) => r.estado === "fechado").length;

  function togglePause() {
    if ($monitorPaused) resumeMonitor();
    else pauseMonitor();
  }

  function liveSec(row) {
    void $tick;
    if (row.estado !== "aberto" || !row.startMs) return 0;
    return Math.max(0, Math.floor((Date.now() - row.startMs) / 1000));
  }

  // Manual hours correction (spec 6.4). The monitor table is per-file; the
  // edit button targets the most recent closed session of that file today.
  $: todayStr = new Date().toISOString().slice(0, 10);
  $: lastClosedByPath = (() => {
    const m = new Map();
    for (const s of $allSessions) {
      if (s.estado !== "fechado") continue;
      if (!(s.inicio || "").startsWith(todayStr)) continue;
      const prev = m.get(s.caminho);
      if (!prev || s.inicio > prev.inicio) m.set(s.caminho, s);
    }
    return m;
  })();
  let editSession = null;
  function openEdit(r) {
    const s = lastClosedByPath.get(r.caminho);
    if (s) editSession = s;
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

<div>
  <SectionHeader kicker="Tempo real" title="Monitorização">
    Detecção automática de eventos de ficheiro via <span class="mono" style="color:var(--text);">notify</span>. Contadores correm em segundo plano.
  </SectionHeader>

  <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; box-shadow:var(--shadow-1); margin-bottom:16px; display:flex; align-items:center; gap:16px;">
    {#if $monitorStatus === "error"}
      <div style="width:44px; height:44px; border-radius:10px; background:oklch(0.97 0.04 25); color:oklch(0.5 0.18 25); display:flex; align-items:center; justify-content:center; border:1px solid oklch(0.85 0.05 25); font-weight:700; font-size:18px;">
        !
      </div>
    {:else}
      <div style="width:44px; height:44px; border-radius:10px; background:{$monitorPaused ? 'oklch(0.97 0.04 80)' : 'var(--live-soft)'}; color:{$monitorPaused ? 'oklch(0.5 0.12 60)' : 'oklch(0.42 0.12 155)'}; display:flex; align-items:center; justify-content:center; border:1px solid {$monitorPaused ? 'oklch(0.88 0.07 80)' : 'oklch(0.85 0.07 155)'};">
        {#if $monitorPaused}
          <Icon name="pause" size={18} />
        {:else}
          <span class="live-dot" style="width:10px; height:10px;"></span>
        {/if}
      </div>
    {/if}

    <div style="flex:1;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <div style="font-size:14px; font-weight:600;">
          {#if $monitorStatus === "error"}
            Erro na monitorização
          {:else if !$rootFolder}
            Pasta raiz não definida
          {:else if $monitorPaused}
            Monitorização pausada
          {:else if $monitorStatus === "watching"}
            A monitorizar — tudo em ordem
          {:else}
            Inactiva
          {/if}
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-2); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <Icon name="folder" size={13} />
        <span class="mono">{$rootFolder || "—"}</span>
        <span style="color:var(--text-3);">·</span>
        <span>limiar de inactividade <span class="mono">{$idleThresholdMin} min</span></span>
        <span style="color:var(--text-3);">·</span>
        <span>{openCount} sessões abertas</span>
        {#if $monitorError}
          <span style="color:var(--text-3);">·</span>
          <span style="color:oklch(0.5 0.18 25);">{$monitorError}</span>
        {/if}
      </div>
    </div>
    {#if $rootFolder}
      {#if $monitorStatus === "error" || $monitorStatus === "idle"}
        <Button variant="primary" on:click={startMonitor}>
          <Icon name="play" size={14} /> Iniciar
        </Button>
      {:else}
        <Button variant={$monitorPaused ? "primary" : "default"} on:click={togglePause}>
          <Icon name={$monitorPaused ? "play" : "pause"} size={14} />
          {$monitorPaused ? "Retomar" : "Pausar"}
        </Button>
      {/if}
    {/if}
  </div>

  <Card title={`Ficheiros activos hoje (${rows.length})`}>
    <div slot="action" style="display:flex; gap:8px; align-items:center;">
      <Badge tone="live"><span class="live-dot"></span>{openCount} abertos</Badge>
      <Badge tone="soft">{closedCount} fechados</Badge>
    </div>
    {#if rows.length === 0}
      <div style="padding:36px; text-align:center; color:var(--text-3); font-size:13px;">
        {#if !$rootFolder}
          Defina uma pasta raiz para começar a monitorizar.
        {:else}
          Sem actividade detectada hoje. Abra um ficheiro na pasta raiz para começar.
        {/if}
      </div>
    {:else}
      <Table>
        <thead>
          <tr>
            <th>Ficheiro</th>
            <th>Cliente</th>
            <th>Tipo · regra</th>
            <th class="right">Sessão actual</th>
            <th class="right">Total dia</th>
            <th class="right">Estado</th>
            <th class="right"></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r}
            {@const live = liveSec(r)}
            {@const totalSec = r.estado === "aberto" ? r.totalDiaSec + live : r.totalDiaSec}
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                  {#if r.estado === "aberto"}
                    <span class="live-dot"></span>
                  {:else}
                    <span style="width:7px; height:7px; border-radius:50%; background:var(--border-strong); display:inline-block;"></span>
                  {/if}
                  <div style="min-width:0;">
                    <div class="mono" style="font-size:12px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:320px;">{r.nome}</div>
                  </div>
                </div>
              </td>
              <td>{r.clienteNome}</td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <Badge tone={r.tipo === "—" ? "soft" : "accent"}>{r.tipo}</Badge>
                  <span class="mono" style="font-size:11px; color:var(--text-3);">{r.regraLabel}</span>
                </div>
              </td>
              <td class="right mono">
                {#if r.estado === "aberto"}
                  <span style="color:oklch(0.42 0.12 155); font-weight:600;">{fmtSecondsAsHHMMSS(live)}</span>
                {:else}
                  <span style="color:var(--text-3);">—</span>
                {/if}
              </td>
              <td class="right mono">{fmtSecondsAsHM(totalSec)}</td>
              <td class="right"><StatusPill estado={r.estado} /></td>
              <td class="right">
                {#if lastClosedByPath.has(r.caminho)}
                  {@const cs = lastClosedByPath.get(r.caminho)}
                  <button class="mon-edit" class:corr={cs.corrigido_em} title="Corrigir horas da sessão" on:click={() => openEdit(r)}>
                    <Icon name="edit" size={12} />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {/if}
  </Card>

  <SessionEditDialog
    open={!!editSession}
    session={editSession}
    regraLabel={editSession ? regraLabelFor(editSession.ficheiro_nome) : ""}
    priceFn={editSession ? priceFnFor(editSession) : (sec) => 0}
    on:save={onSaveCorrecao}
    on:close={() => (editSession = null)}
  />
</div>

<style>
  .mon-edit {
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
  .mon-edit:hover { color: var(--text); border-color: var(--border-strong); background: var(--bg-alt); }
  .mon-edit.corr { color: oklch(0.55 0.12 60); border-color: oklch(0.85 0.07 60); }
</style>
