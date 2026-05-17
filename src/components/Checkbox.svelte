<script>
  export let checked = false;
  export let indeterminate = false;
  export let size = 16;
</script>

<span
  class="cb"
  class:on={checked || indeterminate}
  style="width:{size}px; height:{size}px;"
  role="checkbox"
  aria-checked={checked}
>
  {#if checked}
    <svg width={size - 5} height={size - 5} viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1.8 5.2L4.2 7.4 8.4 2.8" />
    </svg>
  {:else if indeterminate}
    <span class="dash" style="width:{size - 6}px;"></span>
  {/if}
</span>

<style>
  .cb {
    border-radius: 4px;
    border: 1.4px solid var(--border-strong);
    background: var(--surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    transition: all 0.12s ease;
  }
  .cb.on {
    border-color: var(--accent);
    background: var(--accent);
    box-shadow: 0 0 0 3px oklch(0.42 0.08 250 / 0.12);
  }
  .dash {
    height: 2px;
    background: white;
    border-radius: 1px;
  }
</style>
