<script>
  // Adjustment editor (spec 8.2). Works at file / cliente / global scope with
  // fixo (€) | hora (€/h) | pct (%) types and an explicit +/− sign. Shows a live
  // base → ajuste → valor final preview.
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";
  import { fmtEuro, fmtNumber } from "../lib/format.js";
  import { applyAjuste } from "../lib/adjust.js";

  export let open = false;
  // ctx: { scope:'ficheiro'|'cliente'|'global', label, sub, base, horas, current }
  export let ctx = null;

  const dispatch = createEventDispatcher();

  let tipo = "fixo";
  let sign = "+";
  let valor = "";
  let lastKey = null;

  $: ctxKey = ctx ? `${ctx.scope}:${ctx.label}` : null;
  $: if (ctx && ctxKey !== lastKey) {
    lastKey = ctxKey;
    tipo = ctx.current?.tipo || "fixo";
    sign = (ctx.current?.valor ?? 0) < 0 ? "-" : "+";
    valor = ctx.current ? String(Math.abs(ctx.current.valor)).replace(".", ",") : "";
  }

  const scopeLabels = {
    ficheiro: "Ajuste do ficheiro",
    cliente: "Ajuste do cliente",
    global: "Ajuste global do total",
  };

  $: num = parseFloat((valor || "0").replace(",", ".")) || 0;
  $: signed = (sign === "+" ? 1 : -1) * num;
  $: previewAdj = ctx ? applyAjuste({ tipo, valor: signed }, ctx.base, ctx.horas) : 0;
  $: final = ctx ? ctx.base + previewAdj : 0;

  function handleSave() {
    if (!num) dispatch("save", { next: null });
    else dispatch("save", { next: { tipo, valor: signed } });
  }
</script>

<Modal {open} kicker={ctx ? scopeLabels[ctx.scope] : ""} title={ctx?.label || ""} width={480} on:close={() => dispatch("close")}>
  {#if ctx}
    {#if ctx.sub}
      <div class="sub">{ctx.sub}</div>
    {/if}

    <div class="lbl">Tipo de ajuste</div>
    <div class="seg">
      {#each [["fixo", "Valor fixo (€)"], ["hora", "Por hora (€/h)"], ["pct", "Percentagem (%)"]] as [v, l]}
        <button type="button" class:active={tipo === v} on:click={() => (tipo = v)}>{l}</button>
      {/each}
    </div>
    <div class="hint">
      {#if tipo === "fixo"}Adicionar ou subtrair um montante fixo ao valor base.
      {:else if tipo === "hora"}Acrescentar ou reduzir um valor por hora. Recalculado sobre <span class="mono num">{fmtNumber(ctx.horas || 0, 1)} h</span>.
      {:else}Aumento ou desconto percentual sobre o valor base.{/if}
    </div>

    <div class="lbl" style="margin-top:14px;">Valor</div>
    <div style="display:flex; gap:8px; align-items:center;">
      <div class="sign">
        <button type="button" class:on={sign === "+"} class="plus" on:click={() => (sign = "+")}>+</button>
        <button type="button" class:on={sign === "-"} class="minus" on:click={() => (sign = "-")}>−</button>
      </div>
      <input
        class="fld mono"
        type="text"
        inputmode="decimal"
        bind:value={valor}
        placeholder="0,00"
      />
      <span class="suffix mono">{tipo === "fixo" ? "€" : tipo === "hora" ? "€/h" : "%"}</span>
    </div>

    <div class="recap">
      <div class="recap-row">
        <span style="color:var(--text-3);">Valor base</span>
        <span class="mono num">{fmtEuro(ctx.base)}</span>
      </div>
      <div class="recap-row">
        <span style="color:var(--text-3);">Ajuste aplicado <span style="font-size:10.5px; opacity:0.7;">({tipo === "fixo" ? "fixo" : tipo === "hora" ? "por hora" : "percentagem"})</span></span>
        <span class="mono num" style="font-weight:600; color:{previewAdj < 0 ? 'oklch(0.5 0.18 25)' : previewAdj > 0 ? 'oklch(0.42 0.12 155)' : 'var(--text-3)'};">
          {previewAdj === 0 ? "—" : (previewAdj >= 0 ? "+" : "−") + fmtEuro(Math.abs(previewAdj))}
        </span>
      </div>
      <div class="recap-row total">
        <span>Valor final</span>
        <span class="mono num">{fmtEuro(final)}</span>
      </div>
    </div>
  {/if}

  <svelte:fragment slot="footer">
    {#if ctx?.current}
      <Button variant="danger" on:click={() => dispatch("save", { next: null })}>
        <Icon name="trash" size={13} /> Remover ajuste
      </Button>
    {/if}
    <div style="flex:1;"></div>
    <Button on:click={() => dispatch("close")}>Cancelar</Button>
    <Button variant="primary" on:click={handleSave}>
      <Icon name="check" size={14} stroke={2} /> Guardar ajuste
    </Button>
  </svelte:fragment>
</Modal>

<style>
  .sub { font-size: 12px; color: var(--text-3); margin-bottom: 16px; }
  .lbl {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-2);
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .seg {
    display: inline-flex;
    padding: 3px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 9px;
    gap: 2px;
  }
  .seg button {
    padding: 5px 12px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-ui);
  }
  .seg button.active {
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    box-shadow: var(--shadow-1);
  }
  .hint { font-size: 11px; color: var(--text-3); margin-top: 6px; line-height: 1.4; }
  .sign {
    display: flex;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .sign button {
    width: 40px;
    height: 36px;
    border: none;
    background: var(--surface);
    color: var(--text-2);
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
  }
  .sign .minus { border-left: 1px solid var(--border-strong); }
  .sign .plus.on { background: oklch(0.62 0.14 155); color: white; }
  .sign .minus.on { background: oklch(0.5 0.18 25); color: white; }
  .fld {
    flex: 1;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    text-align: right;
  }
  .fld:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px oklch(0.42 0.08 250 / 0.12);
  }
  .suffix {
    width: 44px;
    text-align: center;
    font-size: 13px;
    color: var(--text-2);
    font-weight: 500;
  }
  .recap {
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 16px;
  }
  .recap-row { display: flex; justify-content: space-between; font-size: 12px; }
  .recap-row.total {
    border-top: 1px dashed var(--border-strong);
    padding-top: 8px;
    margin-top: 2px;
    font-size: 13.5px;
    font-weight: 700;
  }
</style>
