<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Metric from "../components/Metric.svelte";
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Button from "../components/Button.svelte";
  import Table from "../components/Table.svelte";
  import StatusPill from "../components/StatusPill.svelte";
  import CobrancaPill from "../components/CobrancaPill.svelte";
  import Icon from "../components/Icon.svelte";
  import { clientes } from "../stores/clientes.js";
  import { allSessions, activeSessions } from "../stores/sessoes.js";
  import { historico } from "../stores/cobrancas.js";
  import { regras } from "../stores/regras.js";
  import { defaultRule } from "../stores/settings.js";
  import { goCliente, navigate } from "../stores/navigation.js";
  import { tick } from "../stores/monitor.js";
  import { fmtEuro, fmtNumber } from "../lib/format.js";
  import {
    aggregateClientes, aggregateTotals, typeDistribution,
  } from "../lib/aggregations.js";
  import { priceFile } from "../lib/pricing.js";

  // Dashboard is a permanent view — no period filter (spec 4). All metrics
  // reflect accumulated state; "este mês" metrics use the current calendar month.
  const ALL = { from: "1970-01-01", to: "2999-12-31" };

  $: aggs = aggregateClientes($clientes, $allSessions, $regras, $defaultRule, ALL);
  $: totals = aggregateTotals(aggs);
  $: tipos = typeDistribution($allSessions, $regras, $defaultRule, ALL);
  $: recent = ($tick,
    $allSessions
    .slice(0, 8)
    .map((s) => ({
      ficheiro: s.ficheiro_nome,
      cliente: s.cliente_nome,
      clienteId: s.cliente_id,
      duracao: durStr(s),
      valor: s.valor || liveValor(s),
      estado: s.estado,
      cobranca: s.cobranca_id != null ? "cobrado" : "por-cobrar",
    })));
  $: porCobrarClientes = aggs
    .filter((c) => c.valorPorCobrar > 0)
    .sort((a, b) => b.valorPorCobrar - a.valorPorCobrar)
    .slice(0, 5);
  $: porCobrarMax = porCobrarClientes.length ? Math.max(...porCobrarClientes.map((c) => c.valorPorCobrar)) : 1;
  $: sessoesAtivas = $activeSessions.size;
  $: totalPorCobrar = totals.valorPorCobrar;
  $: ficheirosPorCobrar = totals.ficheirosPorCobrar;
  $: clientesPorCobrar = aggs.filter((c) => c.valorPorCobrar > 0).length;
  $: ym = (() => {
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0");
  })();
  $: mesAgg = (() => {
    let horas = 0, sessoes = 0;
    for (const s of $allSessions) {
      if (s.estado !== "fechado") continue;
      if ((s.inicio || "").slice(0, 7) !== ym) continue;
      horas += (s.duracao_seg || 0) / 3600;
      sessoes += 1;
    }
    return { horas, sessoes };
  })();
  $: cobradoEsteMes = $historico
    .filter((h) => (h.data || "").slice(0, 7) === ym)
    .reduce((a, h) => a + (h.total || 0), 0);

  function durStr(s) {
    let sec = s.duracao_seg;
    if (s.estado === "aberto") sec = Math.max(0, Math.floor((Date.now() - new Date(s.inicio).getTime()) / 1000));
    sec = sec || 0;
    void $tick;
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const ss = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${ss}`;
  }
  function liveValor(s) {
    void $tick;
    const sec = Math.max(0, Math.floor((Date.now() - new Date(s.inicio).getTime()) / 1000));
    const { valor } = priceFile(s.ficheiro_nome, sec, $regras, $defaultRule);
    return valor;
  }
</script>

<div>
  <SectionHeader kicker="Geral" title="Painel">
    Visão geral permanente · valores acumulados desde sempre
  </SectionHeader>

  <div style="display:flex; gap:12px; margin-bottom:22px;">
    <Metric label="Total por cobrar" value={fmtNumber(totalPorCobrar / 1000, 2)} unit="k €" accent>
      <svelte:fragment slot="sub">{ficheirosPorCobrar} ficheiros em {clientesPorCobrar} clientes</svelte:fragment>
    </Metric>
    <Metric label="Ficheiros em curso" value={sessoesAtivas} unit={sessoesAtivas === 1 ? "sessão activa" : "sessões activas"}>
      <svelte:fragment slot="sub">
        <span class="live-dot" style="width:6px; height:6px;"></span> a decorrer agora
      </svelte:fragment>
    </Metric>
    <Metric label="Total cobrado este mês" value={fmtNumber(cobradoEsteMes / 1000, 2)} unit="k €">
      <svelte:fragment slot="sub">Já marcado como cobrado</svelte:fragment>
    </Metric>
    <Metric label="Horas trabalhadas este mês" value={fmtNumber(mesAgg.horas, 1)} unit="h">
      <svelte:fragment slot="sub">{mesAgg.sessoes} sessões este mês</svelte:fragment>
    </Metric>
  </div>

  <div style="display:grid; grid-template-columns:1.6fr 1fr; gap:14px;">
    <Card title="Actividade recente">
      <div slot="action" style="display:flex; gap:8px; align-items:center;">
        <Badge tone="soft">{recent.length} sessões</Badge>
        <Button variant="ghost" size="sm" on:click={() => navigate("monitor")}>
          Ver tudo <Icon name="arrow" size={14} />
        </Button>
      </div>
      {#if recent.length === 0}
        <div style="padding:32px; text-align:center; color:var(--text-3); font-size:12.5px;">
          Sem actividade registada.
        </div>
      {:else}
        <Table>
          <thead>
            <tr>
              <th>Ficheiro</th>
              <th>Cliente</th>
              <th class="right">Duração</th>
              <th class="right">Valor</th>
              <th class="right">Cobrança</th>
              <th class="right">Sessão</th>
            </tr>
          </thead>
          <tbody>
            {#each recent as r}
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <div style="width:26px; height:26px; border-radius:6px; background:{r.estado === 'aberto' ? 'var(--live-soft)' : 'var(--bg-alt)'}; color:{r.estado === 'aberto' ? 'oklch(0.42 0.12 155)' : 'var(--text-3)'}; display:flex; align-items:center; justify-content:center; border:1px solid {r.estado === 'aberto' ? 'oklch(0.85 0.07 155)' : 'var(--border)'}; flex-shrink:0;">
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" stroke-width="1.4">
                        <path d="M2 1.5h5.5L10.5 4.5v8c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5v-11c0-.3.2-.5.5-.5z" />
                        <path d="M7 1.5v3h3" />
                      </svg>
                    </div>
                    <div style="min-width:0;">
                      <div style="font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:320px;">{r.ficheiro}</div>
                    </div>
                  </div>
                </td>
                <td><span style="cursor:pointer;" on:click={() => goCliente(r.clienteId)}>{r.cliente}</span></td>
                <td class="right mono">
                  {#if r.estado === "aberto"}
                    <span style="color:oklch(0.42 0.12 155);">{r.duracao}</span>
                  {:else}
                    {r.duracao}
                  {/if}
                </td>
                <td class="right mono"><span style="font-weight:{r.cobranca === 'por-cobrar' ? 600 : 500}; color:{r.cobranca === 'por-cobrar' ? 'var(--text)' : 'var(--text-2)'};">{fmtEuro(r.valor)}</span></td>
                <td class="right"><CobrancaPill estado={r.cobranca} /></td>
                <td class="right"><StatusPill estado={r.estado} /></td>
              </tr>
            {/each}
          </tbody>
        </Table>
      {/if}
    </Card>

    <div style="display:flex; flex-direction:column; gap:14px;">
      <Card title="Por cobrar — por cliente">
        <div slot="action">
          <Button variant="ghost" size="sm" on:click={() => navigate("cobrancas")}>
            Ir para cobranças <Icon name="arrow" size={14} />
          </Button>
        </div>
        {#if porCobrarClientes.length === 0}
          <div style="padding:24px; text-align:center; color:var(--text-3); font-size:12.5px;">Tudo cobrado.</div>
        {:else}
          <div style="padding:8px 0;">
            {#each porCobrarClientes as c, i}
              {@const pct = (c.valorPorCobrar / porCobrarMax) * 100}
              <div
                on:click={() => goCliente(c.id)}
                on:keypress={(e) => e.key === "Enter" && goCliente(c.id)}
                role="button"
                tabindex="0"
                style="padding:10px 18px; display:flex; flex-direction:column; gap:6px; cursor:pointer; border-bottom:{i < porCobrarClientes.length - 1 ? '1px solid var(--border)' : 'none'};"
              >
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="font-size:13px; font-weight:500;">{c.nome}</div>
                  <div class="mono num" style="font-size:12px; font-weight:600; color:oklch(0.45 0.1 60);">{fmtEuro(c.valorPorCobrar, 0)}</div>
                </div>
                <div style="height:4px; background:var(--bg-alt); border-radius:2px; overflow:hidden;">
                  <div style="width:{pct}%; height:100%; background:oklch(0.7 0.12 60);"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10.5px; color:var(--text-3); font-family:var(--font-mono);">
                  <span>{c.ficheirosPorCobrar} ficheiros</span>
                  <span>Cobrado: {fmtEuro(c.valorCobrado, 0)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <Card title="Distribuição por tipo">
        {#if tipos.length === 0}
          <div style="padding:24px; text-align:center; color:var(--text-3); font-size:12.5px;">Sem dados.</div>
        {:else}
          <div style="padding:18px; display:flex; flex-direction:column; gap:10px;">
            {#each tipos as t}
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:80px; font-size:12px; color:var(--text-2);">{t.tipo}</div>
                <div style="flex:1; height:6px; background:var(--bg-alt); border-radius:3px; overflow:hidden;">
                  <div style="width:{Math.min(100, t.pct * 2.6)}%; height:100%; background:oklch(0.62 0.07 250);"></div>
                </div>
                <div class="mono num" style="width:60px; text-align:right; font-size:11px; color:var(--text-2);">{fmtEuro(t.valor, 0)}</div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    </div>
  </div>
</div>
