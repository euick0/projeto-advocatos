<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Table from "../components/Table.svelte";
  import Segmented from "../components/Segmented.svelte";
  import BarChart from "../components/BarChart.svelte";
  import { clientes } from "../stores/clientes.js";
  import { allSessions } from "../stores/sessoes.js";
  import { historico } from "../stores/cobrancas.js";
  import { regras } from "../stores/regras.js";
  import { defaultRule } from "../stores/settings.js";
  import { periodo } from "../stores/navigation.js";
  import { fmtEuro, fmtNumber } from "../lib/format.js";
  import {
    aggregateClientes, aggregateTotals, weeklyBreakdown,
  } from "../lib/aggregations.js";

  const _today = new Date();
  const _todayStr = _today.toISOString().slice(0, 10);
  const _firstOfMonth = _today.getFullYear() + "-" + String(_today.getMonth() + 1).padStart(2, "0") + "-01";

  let periodoTab = "mes";
  let customFrom = _firstOfMonth;
  let customTo = _todayStr;

  $: {
    if (periodoTab !== "custom") {
      $periodo = periodoTab;
    } else if (customFrom && customTo && customFrom <= customTo) {
      $periodo = { from: customFrom, to: customTo };
    }
  }

  $: aggs = aggregateClientes($clientes, $allSessions, $regras, $defaultRule, $periodo);
  $: aggs2 = aggs.filter((c) => c.horas > 0 || c.valor > 0);
  $: totals = aggregateTotals(aggs2);
  $: weekData = weeklyBreakdown($allSessions, $periodo);
  $: chartTitle = $periodo === "semana" ? "Valor faturado por dia" : "Valor faturado por semana";

  const initials = (n) =>
    n.split(/[\s_\-]+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
</script>

<div>
  <SectionHeader kicker="Faturação" title="Análise">
    <svelte:fragment slot="action">
      <Segmented
        bind:value={periodoTab}
        options={[
          { value: "semana", label: "Esta semana" },
          { value: "mes", label: "Este mês" },
          { value: "3mes", label: "Últimos 3 meses" },
          { value: "custom", label: "Personalizado" },
        ]}
      />
    </svelte:fragment>
    Toda a análise é feita dentro da aplicação — nenhum dado é enviado para servidores externos.
  </SectionHeader>

  {#if periodoTab === "custom"}
    {@const validRange = customFrom && customTo && customFrom <= customTo}
    {@const customDays = validRange ? Math.round((new Date(customTo) - new Date(customFrom)) / 86400000) + 1 : 0}
    <div class="date-range-bar">
      <div class="date-field">
        <span class="date-label">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="10" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M1 5h10" stroke="currentColor" stroke-width="1.3"/>
            <path d="M4 1v2M8 1v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          De
        </span>
        <input class="date-input" type="date" bind:value={customFrom} max={customTo || undefined} />
      </div>

      <svg class="date-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <div class="date-field">
        <span class="date-label">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="10" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M1 5h10" stroke="currentColor" stroke-width="1.3"/>
            <path d="M4 1v2M8 1v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Até
        </span>
        <input class="date-input" type="date" bind:value={customTo} min={customFrom || undefined} />
      </div>

      {#if validRange}
        <div class="date-badge">
          {customDays} {customDays === 1 ? "dia" : "dias"}
        </div>
      {:else if customFrom && customTo}
        <div class="date-error">Início posterior ao fim</div>
      {/if}
    </div>
  {/if}

  <Card title={chartTitle} style="margin-bottom:14px;">
    <div slot="action" style="display:flex; gap:14px; align-items:center;">
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="width:10px; height:10px; border-radius:2px; background:oklch(0.78 0.04 250); border:1px solid oklch(0.7 0.05 250); display:inline-block;"></span>
        <span style="font-size:11px; color:var(--text-2);">Semanas anteriores</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="width:10px; height:10px; border-radius:2px; background:var(--accent); display:inline-block;"></span>
        <span style="font-size:11px; color:var(--text-2);">Semana actual</span>
      </div>
    </div>
    <BarChart data={weekData} height={240} />
  </Card>

  <Card title="Análise por cliente">
    {#if aggs2.length === 0}
      <div style="padding:32px; text-align:center; color:var(--text-3); font-size:12.5px;">Sem actividade neste período.</div>
    {:else}
      <Table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th class="right">Horas</th>
            <th class="right">Ficheiros</th>
            <th>Tipo mais frequente</th>
            <th class="right">Cobrado</th>
            <th class="right">Por cobrar</th>
          </tr>
        </thead>
        <tbody>
          {#each aggs2 as r}
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:26px; height:26px; border-radius:6px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:10.5px; border:1px solid var(--accent-line);">
                    {initials(r.nome)}
                  </div>
                  <span style="font-weight:500;">{r.nome}</span>
                </div>
              </td>
              <td class="right mono">{fmtNumber(r.horas, 1)} h</td>
              <td class="right mono">{r.ficheiros}</td>
              <td><Badge tone={r.tipoFreq === "—" ? "soft" : "accent"}>{r.tipoFreq}</Badge></td>
              <td class="right mono"><span style="color:var(--text-2);">{fmtEuro(r.valorCobrado)}</span></td>
              <td class="right mono">
                {#if r.valorPorCobrar > 0}
                  <span style="font-weight:700; color:oklch(0.45 0.1 60);">{fmtEuro(r.valorPorCobrar)}</span>
                {:else}
                  <span style="color:var(--text-3);">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding:14px 16px; border-top:2px solid var(--border-strong); background:var(--bg-alt); font-size:12px; font-weight:700; color:var(--text); letter-spacing:0.3px; text-transform:uppercase; border-bottom:none;">Total geral</td>
            <td style="padding:14px 16px; border-top:2px solid var(--border-strong); background:var(--bg-alt); text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums; font-size:12px; font-weight:600; border-bottom:none;">{fmtNumber(totals.horas, 1)} h</td>
            <td style="padding:14px 16px; border-top:2px solid var(--border-strong); background:var(--bg-alt); text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums; font-size:12px; font-weight:600; border-bottom:none;">{totals.ficheiros} fich.</td>
            <td style="padding:14px 16px; border-top:2px solid var(--border-strong); background:var(--bg-alt); border-bottom:none;"></td>
            <td style="padding:14px 16px; border-top:2px solid var(--border-strong); background:var(--bg-alt); text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums; font-size:13px; font-weight:700; color:var(--text-2); border-bottom:none;">{fmtEuro(totals.valorCobrado)}</td>
            <td style="padding:14px 16px; border-top:2px solid var(--border-strong); background:var(--bg-alt); text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums; font-size:14px; font-weight:700; color:oklch(0.45 0.1 60); border-bottom:none;">{fmtEuro(totals.valorPorCobrar)}</td>
          </tr>
        </tfoot>
      </Table>
    {/if}
  </Card>

  <Card title="Histórico de cobranças" style="margin-top:14px;">
    <div slot="action"><Badge tone="soft">{$historico.length} cobranças</Badge></div>
    {#if $historico.length === 0}
      <div style="padding:32px; text-align:center; color:var(--text-3); font-size:12.5px;">Ainda não foram efectuadas cobranças.</div>
    {:else}
      <Table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Clientes incluídos</th>
            <th class="right">Ficheiros</th>
            <th class="right">Base</th>
            <th class="right">Ajustes</th>
            <th class="right">Valor cobrado</th>
          </tr>
        </thead>
        <tbody>
          {#each $historico as h}
            {@const d = new Date(h.data)}
            {@const base = h.base ?? h.total}
            {@const adj = h.ajuste_total ?? (h.total - base)}
            <tr>
              <td class="mono">
                <div style="font-weight:500; color:var(--text);">{d.toLocaleDateString("pt-PT")}</div>
                <div style="font-size:10.5px; color:var(--text-3);">{d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</div>
              </td>
              <td>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                  {#each h.clientes as c}
                    <Badge tone="soft">{c.nome}</Badge>
                  {/each}
                </div>
              </td>
              <td class="right mono">{h.num_ficheiros}</td>
              <td class="right mono"><span style="color:var(--text-2);">{fmtEuro(base)}</span></td>
              <td class="right mono">
                {#if Math.abs(adj) >= 0.005}
                  <span style="font-weight:600; color:{adj < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">{(adj >= 0 ? "+" : "−") + fmtEuro(Math.abs(adj))}</span>
                {:else}
                  <span style="color:var(--text-3);">—</span>
                {/if}
              </td>
              <td class="right mono"><span style="font-weight:600;">{fmtEuro(h.total)}</span></td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {/if}
  </Card>
</div>

<style>
  .date-range-bar {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-1);
    flex-wrap: wrap;
  }

  .date-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .date-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding-left: 1px;
  }

  .date-input {
    font-size: 13px;
    font-weight: 500;
    padding: 7px 11px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-alt);
    color: var(--text);
    outline: none;
    font-family: inherit;
    cursor: pointer;
    min-width: 148px;
    transition: border-color 0.12s, box-shadow 0.12s, background 0.12s;
  }

  .date-input:hover {
    border-color: var(--border-strong);
    background: var(--bg);
  }

  .date-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
    background: var(--surface);
  }

  .date-arrow {
    color: var(--text-3);
    flex-shrink: 0;
    margin-bottom: 9px;
  }

  .date-badge {
    padding: 7px 12px;
    background: var(--accent-soft);
    border: 1px solid var(--accent-line);
    color: var(--accent);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    align-self: flex-end;
    letter-spacing: 0.2px;
  }

  .date-error {
    font-size: 12px;
    font-weight: 500;
    color: oklch(0.58 0.2 25);
    align-self: flex-end;
    padding-bottom: 3px;
  }
</style>
