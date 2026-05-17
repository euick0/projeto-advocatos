<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Button from "../components/Button.svelte";
  import Icon from "../components/Icon.svelte";
  import Checkbox from "../components/Checkbox.svelte";
  import Tabs from "../components/Tabs.svelte";
  import Modal from "../components/Modal.svelte";
  import AjustarBtn from "../components/AjustarBtn.svelte";
  import AjusteDialog from "../components/AjusteDialog.svelte";
  import { clientes } from "../stores/clientes.js";
  import { allSessions } from "../stores/sessoes.js";
  import { regras } from "../stores/regras.js";
  import { defaultRule } from "../stores/settings.js";
  import { confirmarCobranca } from "../stores/cobrancas.js";
  import { navigate } from "../stores/navigation.js";
  import { fmtEuro, fmtNumber } from "../lib/format.js";
  import { pendentesByCliente } from "../lib/aggregations.js";
  import { priceFile } from "../lib/pricing.js";
  import { applyAjuste, fmtAjusteCompact } from "../lib/adjust.js";

  let aba = "ficheiro"; // ficheiro | cliente
  let selected = new Set(); // file ids (caminho)
  let expanded = new Set(); // cliente ids expanded (aba cliente)
  let confirmOpen = false;
  let working = false;

  // Ajustes — 3 níveis combináveis (spec 8.2)
  let adjFich = {};   // { [caminho]: { tipo, valor } }
  let adjCli = {};     // { [clienteId]: { tipo, valor } }
  let adjGlobal = null;
  let editAdj = null;  // ctx for AjusteDialog

  $: grupos = pendentesByCliente($allSessions, $clientes);
  $: allItems = grupos.flatMap((g) => g.items);
  $: allIds = allItems.map((i) => i.id);
  $: allSelected = allIds.length > 0 && selected.size === allIds.length;
  $: someSelected = selected.size > 0 && !allSelected;
  $: groupStates = Object.fromEntries(
    grupos.map((g) => {
      const ids = g.items.map((i) => i.id);
      const on = ids.filter((id) => selected.has(id)).length;
      return [g.id, on === 0 ? "none" : on === ids.length ? "all" : "some"];
    })
  );

  function tipoOf(nome) {
    const { regra, isDefault } = priceFile(nome, 0, $regras, $defaultRule);
    return isDefault ? "—" : regra.palavra;
  }

  function toggleOne(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    selected = next;
  }
  function toggleAll() {
    selected = allSelected ? new Set() : new Set(allIds);
  }
  function toggleGroup(g) {
    const ids = g.items.map((i) => i.id);
    const allOn = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allOn) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    selected = next;
  }
  function toggleExpand(cid) {
    const next = new Set(expanded);
    if (next.has(cid)) next.delete(cid); else next.add(cid);
    expanded = next;
  }

  // Per-file: base + file-level adjustment.
  function fichAdjVal(p) {
    return applyAjuste(adjFich[p.id], p.valor, p.horas);
  }
  function fichFinal(p) {
    return p.valor + fichAdjVal(p);
  }

  $: selectedItems = allItems.filter((i) => selected.has(i.id));

  // Resumo — base + ajuste de ficheiro + ajuste de cliente, por cliente.
  $: resumoPorCliente = (() => {
    void adjFich; void adjCli; // keep reactive on adjustment edits
    const m = new Map();
    for (const p of selectedItems) {
      if (!m.has(p.clienteId)) {
        m.set(p.clienteId, {
          clienteId: p.clienteId, nome: p.cliente,
          ficheiros: 0, horas: 0,
          baseFich: 0, adjFichTot: 0, afterFichTotal: 0,
        });
      }
      const e = m.get(p.clienteId);
      const adjF = applyAjuste(adjFich[p.id], p.valor, p.horas);
      e.ficheiros += 1;
      e.horas += p.horas;
      e.baseFich += p.valor;
      e.adjFichTot += adjF;
      e.afterFichTotal += p.valor + adjF;
    }
    return Array.from(m.values())
      .map((e) => {
        const adjCliVal = applyAjuste(adjCli[e.clienteId], e.afterFichTotal, e.horas);
        return { ...e, adjCliVal, finalCli: e.afterFichTotal + adjCliVal };
      })
      .sort((a, b) => b.finalCli - a.finalCli);
  })();

  $: sumBase = resumoPorCliente.reduce((a, c) => a + c.baseFich, 0);
  $: sumAdjFich = resumoPorCliente.reduce((a, c) => a + c.adjFichTot, 0);
  $: sumAdjCli = resumoPorCliente.reduce((a, c) => a + c.adjCliVal, 0);
  $: sumHoras = resumoPorCliente.reduce((a, c) => a + c.horas, 0);
  $: subTotal = sumBase + sumAdjFich + sumAdjCli;
  $: adjGlobalVal = applyAjuste(adjGlobal, subTotal, sumHoras);
  $: resumoTotal = subTotal + adjGlobalVal;

  function openAdjFich(p) {
    editAdj = {
      scope: "ficheiro", refId: p.id,
      label: p.ficheiro,
      sub: `${p.cliente} · ${fmtNumber(p.horas, 1)} h · valor base ${fmtEuro(p.valor)}`,
      base: p.valor, horas: p.horas,
      current: adjFich[p.id] || null,
    };
  }
  function openAdjCli(g) {
    const items = g.items;
    const sel = items.filter((p) => selected.has(p.id));
    const used = sel.length > 0 ? sel : items;
    const base = used.reduce((a, p) => a + fichFinal(p), 0);
    const horas = used.reduce((a, p) => a + p.horas, 0);
    editAdj = {
      scope: "cliente", refId: g.id,
      label: g.nome,
      sub: `${used.length} ficheiro${used.length === 1 ? "" : "s"} · ${fmtNumber(horas, 1)} h · base ${fmtEuro(base)}`,
      base, horas,
      current: adjCli[g.id] || null,
    };
  }
  function openAdjGlobal() {
    editAdj = {
      scope: "global", refId: null,
      label: "Total da cobrança",
      sub: `${selectedItems.length} ficheiro${selectedItems.length === 1 ? "" : "s"} · ${fmtNumber(sumHoras, 1)} h · subtotal ${fmtEuro(subTotal)}`,
      base: subTotal, horas: sumHoras,
      current: adjGlobal,
    };
  }
  function saveAdj(e) {
    const next = e.detail.next;
    const { scope, refId } = editAdj;
    if (scope === "ficheiro") {
      const m = { ...adjFich };
      if (next) m[refId] = next; else delete m[refId];
      adjFich = m;
    } else if (scope === "cliente") {
      const m = { ...adjCli };
      if (next) m[refId] = next; else delete m[refId];
      adjCli = m;
    } else {
      adjGlobal = next;
    }
    editAdj = null;
  }

  async function doConfirm() {
    if (working) return;
    working = true;
    try {
      const sessaoIds = selectedItems.flatMap((i) => i.sessaoIds);
      await confirmarCobranca(sessaoIds, {
        total: resumoTotal,
        base: sumBase,
        ajusteTotal: resumoTotal - sumBase,
        numFicheiros: selectedItems.length,
        clientes: resumoPorCliente.map((r) => ({
          nome: r.nome,
          ficheiros: r.ficheiros,
          base: r.baseFich,
          ajuste: r.adjFichTot + r.adjCliVal,
          valor: r.finalCli,
        })),
        ajustes: {
          global: adjGlobal,
          globalValor: adjGlobalVal,
          ficheiroTotal: sumAdjFich,
          clienteTotal: sumAdjCli,
        },
      });
      selected = new Set();
      adjFich = {};
      adjCli = {};
      adjGlobal = null;
      confirmOpen = false;
      navigate("dashboard");
    } finally {
      working = false;
    }
  }
</script>

<div>
  <SectionHeader kicker="Faturação" title="Cobranças">
    Selecione os ficheiros ou clientes a marcar como cobrados, ajuste os valores se necessário, e confirme. O valor final sai do <em>Total por cobrar</em> e fica registado no histórico.
  </SectionHeader>

  {#if grupos.length === 0}
    <Card>
      <div style="padding:40px 22px; text-align:center; color:var(--text-3); font-size:13px;">
        Não há trabalho por cobrar. Tudo cobrado.
      </div>
    </Card>
  {:else}
    <div class="cob-grid">
      <Card>
        <div style="padding:10px 18px 0; display:flex; justify-content:space-between; align-items:center;">
          <Tabs
            bind:value={aba}
            options={[
              { value: "ficheiro", label: "Por ficheiro", count: allItems.length },
              { value: "cliente", label: "Por cliente", count: grupos.length },
            ]}
          />
          <div style="display:flex; align-items:center; gap:10px; padding-bottom:10px;">
            <button class="link-btn" on:click={toggleAll} style="display:flex; align-items:center; gap:8px;">
              <Checkbox checked={allSelected} indeterminate={someSelected} />
              {allSelected ? "Limpar selecção" : "Selecionar tudo"}
            </button>
          </div>
        </div>

        {#if aba === "ficheiro"}
          <div>
            {#each grupos as g}
              {@const st = groupStates[g.id]}
              {@const itemsSel = g.items.filter((p) => selected.has(p.id))}
              {@const headerBase = itemsSel.reduce((a, p) => a + p.valor, 0)}
              {@const headerHoras = itemsSel.reduce((a, p) => a + p.horas, 0)}
              {@const headerAdjF = itemsSel.reduce((a, p) => a + applyAjuste(adjFich[p.id], p.valor, p.horas), 0)}
              {@const headerAfterF = headerBase + headerAdjF}
              {@const headerAdjC = applyAjuste(adjCli[g.id], headerAfterF, headerHoras)}
              {@const headerFinal = headerAfterF + headerAdjC}
              {@const showBreakdown = itemsSel.length > 0 && (headerAdjF !== 0 || headerAdjC !== 0)}
              <div style="border-top:1px solid var(--border);">
                <div class="grp-head">
                  <div on:click={() => toggleGroup(g)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && toggleGroup(g)} style="display:flex; align-items:center; gap:12px; flex:1; min-width:0; cursor:pointer;">
                    <Checkbox checked={st === "all"} indeterminate={st === "some"} />
                    <div style="font-size:13px; font-weight:600;">{g.nome}</div>
                    <Badge tone="soft">{itemsSel.length}/{g.ficheiros} ficheiros</Badge>
                  </div>
                  <span on:click={() => openAdjCli(g)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && openAdjCli(g)}>
                    <AjustarBtn ajuste={adjCli[g.id]} />
                  </span>
                  <div class="mono num" style="font-size:12px; color:var(--text-2); min-width:64px; text-align:right;">{fmtNumber(itemsSel.length > 0 ? headerHoras : g.horas, 1)} h</div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end; min-width:96px;">
                    {#if showBreakdown}
                      <div class="mono num strike">{fmtEuro(headerBase)}</div>
                      <div class="mono num warn-val">{fmtEuro(headerFinal)}</div>
                    {:else}
                      <div class="mono num warn-val">{fmtEuro(itemsSel.length > 0 ? headerBase : g.valor)}</div>
                    {/if}
                  </div>
                </div>
                {#each g.items as p}
                  {@const adj = adjFich[p.id]}
                  {@const fin = fichFinal(p)}
                  <div class="item-row" class:sel={selected.has(p.id)} on:click={() => toggleOne(p.id)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && toggleOne(p.id)}>
                    <Checkbox checked={selected.has(p.id)} />
                    <div style="flex:1; min-width:0;">
                      <div class="mono" style="font-size:12px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{p.ficheiro}</div>
                      <div style="margin-top:2px;">
                        <Badge tone={tipoOf(p.ficheiro) === "—" ? "soft" : "accent"}>{tipoOf(p.ficheiro)}</Badge>
                      </div>
                    </div>
                    <span on:click|stopPropagation={() => openAdjFich(p)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && openAdjFich(p)}>
                      <AjustarBtn ajuste={adj} />
                    </span>
                    <div class="mono num" style="font-size:12px; color:var(--text-3); min-width:60px; text-align:right;">{fmtNumber(p.horas, 1)} h</div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; min-width:90px;">
                      {#if adj && adj.valor}
                        <div class="mono num strike">{fmtEuro(p.valor)}</div>
                        <div class="mono num" style="font-size:13px; font-weight:600;">{fmtEuro(fin)}</div>
                      {:else}
                        <div class="mono num" style="font-size:13px; font-weight:600;">{fmtEuro(p.valor)}</div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <div>
            {#each grupos as g}
              {@const st = groupStates[g.id]}
              {@const isOpen = expanded.has(g.id)}
              {@const itemsSel = g.items.filter((p) => selected.has(p.id))}
              {@const used = itemsSel.length > 0 ? itemsSel : g.items}
              {@const baseCli = used.reduce((a, p) => a + p.valor, 0)}
              {@const adjFichSum = used.reduce((a, p) => a + applyAjuste(adjFich[p.id], p.valor, p.horas), 0)}
              {@const afterFich = baseCli + adjFichSum}
              {@const horasUsed = used.reduce((a, p) => a + p.horas, 0)}
              {@const adjCliVal = applyAjuste(adjCli[g.id], afterFich, horasUsed)}
              {@const finalCli = afterFich + adjCliVal}
              {@const hasAdj = adjFichSum !== 0 || adjCliVal !== 0}
              <div style="border-top:1px solid var(--border);">
                <div class="cli-head" class:all={st === "all"} class:some={st === "some"} on:click={() => toggleGroup(g)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && toggleGroup(g)}>
                  <Checkbox checked={st === "all"} indeterminate={st === "some"} />
                  <button class="expand-btn" class:open={isOpen} on:click|stopPropagation={() => toggleExpand(g.id)} aria-label="Expandir">
                    <Icon name="chevron" size={12} />
                  </button>
                  <div class="avatar-sm">{g.nome.split(/[\s_-]+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()}</div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:13px; font-weight:600;">{g.nome}</div>
                    <div style="font-size:11px; color:var(--text-3); margin-top:1px;">{used.length} ficheiros · {fmtNumber(horasUsed, 1)} h</div>
                  </div>
                  <span on:click|stopPropagation={() => openAdjCli(g)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && openAdjCli(g)}>
                    <AjustarBtn ajuste={adjCli[g.id]} />
                  </span>
                  <div style="display:flex; flex-direction:column; align-items:flex-end; min-width:100px;">
                    {#if hasAdj}
                      <div class="mono num strike">{fmtEuro(baseCli)}</div>
                      <div class="mono num warn-val" style="font-size:14px;">{fmtEuro(finalCli)}</div>
                    {:else}
                      <div class="mono num warn-val" style="font-size:14px;">{fmtEuro(baseCli)}</div>
                    {/if}
                  </div>
                </div>
                {#if isOpen}
                  <div style="background:var(--bg-alt); border-top:1px solid var(--border);">
                    {#each g.items as p}
                      {@const adj = adjFich[p.id]}
                      {@const fin = fichFinal(p)}
                      <div class="sub-row" on:click={() => toggleOne(p.id)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && toggleOne(p.id)}>
                        <Checkbox checked={selected.has(p.id)} size={14} />
                        <div class="mono" style="flex:1; font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{p.ficheiro}</div>
                        <span on:click|stopPropagation={() => openAdjFich(p)} role="button" tabindex="0" on:keypress={(e) => e.key === "Enter" && openAdjFich(p)}>
                          <AjustarBtn ajuste={adj} />
                        </span>
                        <div class="mono num" style="font-size:11.5px; color:var(--text-3); min-width:54px; text-align:right;">{fmtNumber(p.horas, 1)} h</div>
                        <div class="mono num" style="font-size:12px; font-weight:600; min-width:80px; text-align:right;">{fmtEuro(fin)}</div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <div class="resumo-col">
        <Card title="Resumo da cobrança">
          <div style="padding:18px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <div style="font-size:11px; font-weight:600; letter-spacing:0.4px; text-transform:uppercase; color:var(--text-3);">Valor final a cobrar</div>
              <div class="mono num" style="font-size:12px; color:var(--text-2);">{selectedItems.length} ficheiros · {fmtNumber(sumHoras, 1)} h</div>
            </div>
            <div class="num" style="font-family:var(--font-display); font-weight:500; font-size:38px; letter-spacing:-1px; line-height:1; color:{selectedItems.length > 0 ? 'var(--text)' : 'var(--text-3)'};">
              {fmtEuro(resumoTotal)}
            </div>
            {#if selectedItems.length > 0}
              <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px; font-size:11.5px;">
                <div style="display:flex; justify-content:space-between; color:var(--text-3);">
                  <span>Valor base</span>
                  <span class="mono num">{fmtEuro(sumBase)}</span>
                </div>
                {#if sumAdjFich !== 0}
                  <div style="display:flex; justify-content:space-between; color:{sumAdjFich < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">
                    <span>Ajustes de ficheiro</span>
                    <span class="mono num" style="font-weight:600;">{(sumAdjFich >= 0 ? "+" : "−") + fmtEuro(Math.abs(sumAdjFich))}</span>
                  </div>
                {/if}
                {#if sumAdjCli !== 0}
                  <div style="display:flex; justify-content:space-between; color:{sumAdjCli < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">
                    <span>Ajustes de cliente</span>
                    <span class="mono num" style="font-weight:600;">{(sumAdjCli >= 0 ? "+" : "−") + fmtEuro(Math.abs(sumAdjCli))}</span>
                  </div>
                {/if}
                {#if adjGlobalVal !== 0}
                  <div style="display:flex; justify-content:space-between; color:{adjGlobalVal < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">
                    <span>Ajuste global {fmtAjusteCompact(adjGlobal)}</span>
                    <span class="mono num" style="font-weight:600;">{(adjGlobalVal >= 0 ? "+" : "−") + fmtEuro(Math.abs(adjGlobalVal))}</span>
                  </div>
                {/if}
              </div>
            {/if}
            <button class="adj-global" class:on={adjGlobal} disabled={selectedItems.length === 0} on:click={openAdjGlobal}>
              {#if adjGlobal}
                Ajuste global · {fmtAjusteCompact(adjGlobal)} <Icon name="edit" size={11} />
              {:else}
                <Icon name="edit" size={11} /> Ajustar valor final total
              {/if}
            </button>
          </div>
          <div style="border-top:1px solid var(--border); padding:8px 0; max-height:240px; overflow-y:auto;">
            {#if resumoPorCliente.length === 0}
              <div style="padding:12px 18px; font-size:12px; color:var(--text-3); text-align:center;">
                Nenhum ficheiro selecionado.<br />Escolha à esquerda os itens a cobrar.
              </div>
            {:else}
              {#each resumoPorCliente as r}
                {@const showAdj = r.adjFichTot !== 0 || r.adjCliVal !== 0}
                <div style="padding:8px 18px; border-bottom:1px solid var(--border);">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; gap:12px;">
                    <div style="min-width:0;">
                      <div style="font-size:12.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{r.nome}</div>
                      <div class="mono" style="font-size:10.5px; color:var(--text-3);">{r.ficheiros} ficheiros · {fmtNumber(r.horas, 1)} h</div>
                    </div>
                    <div class="mono num" style="font-size:12.5px; font-weight:700;">{fmtEuro(r.finalCli)}</div>
                  </div>
                  {#if showAdj}
                    <div style="margin-top:5px; display:flex; flex-direction:column; gap:2px;">
                      <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-3);">
                        <span>Base</span>
                        <span class="mono num">{fmtEuro(r.baseFich)}</span>
                      </div>
                      {#if r.adjFichTot !== 0}
                        <div style="display:flex; justify-content:space-between; font-size:11px; color:{r.adjFichTot < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">
                          <span>Ajustes de ficheiro</span>
                          <span class="mono num" style="font-weight:600;">{(r.adjFichTot >= 0 ? "+" : "−") + fmtEuro(Math.abs(r.adjFichTot))}</span>
                        </div>
                      {/if}
                      {#if r.adjCliVal !== 0}
                        <div style="display:flex; justify-content:space-between; font-size:11px; color:{r.adjCliVal < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">
                          <span>Ajuste cliente {fmtAjusteCompact(adjCli[r.clienteId])}</span>
                          <span class="mono num" style="font-weight:600;">{(r.adjCliVal >= 0 ? "+" : "−") + fmtEuro(Math.abs(r.adjCliVal))}</span>
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
          <div style="padding:14px; border-top:1px solid var(--border); background:var(--bg-alt); border-radius:0 0 12px 12px; display:flex; flex-direction:column; gap:8px;">
            <Button variant="primary" disabled={selectedItems.length === 0} on:click={() => (confirmOpen = true)} style="width:100%; justify-content:center; height:38px;">
              <Icon name="billing" size={14} /> Marcar como cobrado
            </Button>
            <div style="font-size:10.5px; color:var(--text-3); text-align:center; line-height:1.4;">
              Após confirmação, o valor sai do <em>Total por cobrar</em> e fica no histórico.
            </div>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>

<Modal open={confirmOpen} kicker="Confirmar cobrança" title={`Marcar ${selectedItems.length} ficheiro${selectedItems.length === 1 ? "" : "s"} como cobrado?`} width={460} on:close={() => (confirmOpen = false)}>
  <div style="font-size:13px; color:var(--text-2); line-height:1.5;">
    Será registado um valor de <strong class="mono num">{fmtEuro(resumoTotal)}</strong> em {resumoPorCliente.length} cliente{resumoPorCliente.length === 1 ? "" : "s"}{#if resumoTotal - sumBase !== 0} (valor base <span class="mono num">{fmtEuro(sumBase)}</span>, ajustes <span class="mono num" style="font-weight:600; color:{(resumoTotal - sumBase) < 0 ? 'oklch(0.5 0.18 25)' : 'oklch(0.42 0.12 155)'};">{((resumoTotal - sumBase) >= 0 ? "+" : "−") + fmtEuro(Math.abs(resumoTotal - sumBase))}</span>){/if}. Esta operação é <strong>irreversível pela aplicação</strong> (pode ser corrigida na base de dados).
  </div>
  <svelte:fragment slot="footer">
    <Button on:click={() => (confirmOpen = false)}>Cancelar</Button>
    <Button variant="primary" disabled={working} on:click={doConfirm}>
      <Icon name="check" size={14} stroke={2} /> {working ? "A registar…" : "Confirmar cobrança"}
    </Button>
  </svelte:fragment>
</Modal>

<AjusteDialog open={!!editAdj} ctx={editAdj} on:save={saveAdj} on:close={() => (editAdj = null)} />

<style>
  .cob-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 14px;
    align-items: flex-start;
  }
  .resumo-col { position: sticky; top: 0; display: flex; flex-direction: column; gap: 14px; }

  .link-btn {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 12px;
    color: var(--text-2);
    cursor: pointer;
    font-family: var(--font-ui);
  }

  .grp-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 18px;
    background: var(--bg-alt);
  }
  .item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 18px 10px 36px;
    border-top: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.1s;
  }
  .item-row:hover { background: var(--bg-alt); }
  .item-row.sel { background: var(--accent-soft); }

  .cli-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px;
    cursor: pointer;
    transition: background 0.1s;
  }
  .cli-head:hover { background: var(--bg-alt); }
  .cli-head.all { background: var(--accent-soft); }
  .cli-head.some { background: oklch(0.97 0.02 250); }

  .expand-btn {
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .expand-btn.open { transform: rotate(90deg); }

  .avatar-sm {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    background: var(--accent-soft);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 11px;
    border: 1px solid var(--accent-line);
  }

  .sub-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 18px 8px 68px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
  }
  .sub-row:hover { background: var(--surface); }

  .warn-val { font-size: 13px; font-weight: 700; color: oklch(0.45 0.1 60); }
  .strike { font-size: 10.5px; color: var(--text-3); text-decoration: line-through; opacity: 0.7; }

  .adj-global {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 32px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px dashed var(--border-strong);
    background: var(--surface);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-ui);
    cursor: pointer;
    margin-top: 2px;
  }
  .adj-global:hover:not(:disabled) { border-color: var(--text-3); }
  .adj-global:disabled { opacity: 0.5; cursor: not-allowed; }
  .adj-global.on {
    border-style: solid;
    border-color: oklch(0.85 0.07 60);
    background: oklch(0.97 0.04 80);
    color: oklch(0.45 0.1 60);
    font-family: var(--font-mono);
  }
</style>
