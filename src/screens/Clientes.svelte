<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Metric from "../components/Metric.svelte";
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Table from "../components/Table.svelte";
  import Icon from "../components/Icon.svelte";
  import Button from "../components/Button.svelte";
  import { clientes, rescan, scanning } from "../stores/clientes.js";
  import { allSessions } from "../stores/sessoes.js";
  import { regras } from "../stores/regras.js";
  import { defaultRule, rootFolder } from "../stores/settings.js";
  import { periodo } from "../stores/navigation.js";
  import { fmtEuro, fmtNumber } from "../lib/format.js";
  import { aggregateClientes, aggregateTotals } from "../lib/aggregations.js";
  import { goCliente } from "../stores/navigation.js";

  let query = "";

  $: aggs = aggregateClientes($clientes, $allSessions, $regras, $defaultRule, $periodo);
  $: filtered = aggs.filter((c) => c.nome.toLowerCase().includes(query.toLowerCase()));
  $: totals = aggregateTotals(aggs);

  const initials = (n) =>
    n.split(/[\s_\-]+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-");
</script>

<div>
  <SectionHeader kicker="Clientes" title="Carteira de clientes">
    <svelte:fragment slot="action">
      <Button on:click={() => rescan()} disabled={!$rootFolder || $scanning}>
        <Icon name="folder" size={13} /> {$scanning ? "A analisar…" : "Re-scan"}
      </Button>
    </svelte:fragment>
    {#if $rootFolder}
      Detectados automaticamente a partir das subpastas em <span class="mono" style="color:var(--text);">{$rootFolder}</span>
    {:else}
      Defina uma pasta raiz em <strong>Definições</strong> para começar.
    {/if}
  </SectionHeader>

  <div style="display:flex; gap:12px; margin-bottom:16px;">
    <Metric label="Clientes detectados" value={aggs.length} unit="subpastas" />
    <Metric label="Total ficheiros" value={totals.ficheiros} unit="registados" />
    <Metric label="Total cobrado" value={fmtNumber(totals.valorCobrado / 1000, 2)} unit="k €" />
    <Metric label="Total por cobrar" value={fmtNumber(totals.valorPorCobrar / 1000, 2)} unit="k €" accent />
  </div>

  {#if aggs.length === 0}
    <Card>
      <div style="padding:36px 22px; text-align:center; color:var(--text-3); font-size:13px;">
        {#if !$rootFolder}
          Nenhuma pasta raiz definida. Vá a <strong>Definições</strong>.
        {:else}
          Nenhum cliente detectado. A pasta raiz não tem subpastas, ou ainda não foi feito scan.
        {/if}
      </div>
    </Card>
  {:else}
    <Card title="Lista de clientes">
      <div slot="action" style="display:flex; align-items:center; gap:10px;">
        <div style="position:relative;">
          <div style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-3); display:flex;">
            <Icon name="search" size={14} />
          </div>
          <input
            bind:value={query}
            placeholder="Pesquisar cliente…"
            style="background:var(--bg-alt); border:1px solid var(--border); border-radius:8px; padding:0 12px 0 32px; height:30px; font-size:12px; width:220px;"
          />
        </div>
        <Badge tone="soft">{filtered.length} de {aggs.length}</Badge>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th class="right">Ficheiros</th>
            <th class="right">Horas</th>
            <th class="right">Total no período</th>
            <th class="right">Por cobrar</th>
            <th class="right" style="width:24px;"></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as r}
            <tr class="clickable" on:click={() => goCliente(r.id)}>
              <td>
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:32px; height:32px; border-radius:8px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px; letter-spacing:0.5px; border:1px solid var(--accent-line);">
                    {initials(r.nome)}
                  </div>
                  <div>
                    <div style="font-weight:500; font-size:13px;">{r.nome}</div>
                    <div class="mono" style="font-size:11px; color:var(--text-3); margin-top:1px;">/{slug(r.nome)}</div>
                  </div>
                </div>
              </td>
              <td class="right mono">{r.ficheiros}</td>
              <td class="right mono">{fmtNumber(r.horas, 1)} h</td>
              <td class="right mono"><span style="color:var(--text-2);">{fmtEuro(r.valor)}</span></td>
              <td class="right">
                {#if r.valorPorCobrar > 0}
                  <div style="display:inline-flex; flex-direction:column; align-items:flex-end; gap:2px;">
                    <span class="mono num" style="font-size:13px; font-weight:700; color:oklch(0.45 0.1 60);">{fmtEuro(r.valorPorCobrar)}</span>
                    <span style="font-size:10px; color:var(--text-3);">{r.ficheirosPorCobrar} ficheiros</span>
                  </div>
                {:else}
                  <Badge tone="soft">Tudo cobrado</Badge>
                {/if}
              </td>
              <td class="right"><span style="color:var(--text-3); display:flex; justify-content:flex-end;"><Icon name="chevron" size={14} /></span></td>
            </tr>
          {/each}
        </tbody>
      </Table>
    </Card>
  {/if}
</div>
