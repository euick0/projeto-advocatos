<script>
  // Compact "Ajustar" trigger. Shows the current adjustment label when set.
  import Icon from "./Icon.svelte";
  import { fmtAjusteCompact } from "../lib/adjust.js";
  export let ajuste = null;
  $: tem = !!ajuste && !!ajuste.valor;
</script>

<button
  type="button"
  class="adj-btn"
  class:on={tem}
  title={tem ? "Editar ajuste" : "Adicionar ajuste"}
>
  {#if tem}
    {fmtAjusteCompact(ajuste)}
  {:else}
    <Icon name="edit" size={11} />
    <span>Ajustar</span>
  {/if}
</button>

<style>
  .adj-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    border: 1px dashed var(--border-strong);
    background: var(--surface);
    color: var(--text-3);
    font-size: 11px;
    font-weight: 500;
    font-family: var(--font-ui);
    white-space: nowrap;
    cursor: pointer;
  }
  .adj-btn:hover { color: var(--text-2); border-color: var(--text-3); }
  .adj-btn.on {
    border-style: solid;
    border-color: oklch(0.85 0.07 60);
    background: oklch(0.97 0.04 80);
    color: oklch(0.45 0.1 60);
    font-weight: 600;
    font-family: var(--font-mono);
  }
</style>
