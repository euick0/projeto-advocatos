<script>
  export let value;
  export let options = []; // [{ value, label, count }]
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  function pick(v) {
    value = v;
    dispatch("change", v);
  }
</script>

<div class="tabs">
  {#each options as o}
    {@const active = o.value === value}
    <button class="tab" class:active on:click={() => pick(o.value)}>
      {o.label}
      {#if o.count != null}
        <span class="count" class:active>{o.count}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: 24px;
    border-bottom: 1px solid var(--border);
    padding-left: 4px;
  }
  .tab {
    background: transparent;
    border: none;
    padding: 10px 2px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-2);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-family: var(--font-ui);
  }
  .tab.active {
    font-weight: 600;
    color: var(--text);
    border-bottom-color: var(--accent);
  }
  .count {
    font-size: 10.5px;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--bg-alt);
    color: var(--text-3);
    font-weight: 600;
    border: 1px solid var(--border);
  }
  .count.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-line);
  }
</style>
