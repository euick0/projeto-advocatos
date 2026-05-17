<script>
  export let value;
  export let options = [];
</script>

<div style="display:inline-flex; padding:3px; background:var(--bg-alt); border:1px solid var(--border); border-radius:9px; gap:2px;">
  {#each options as o}
    {@const active = o.value === value}
    <button
      on:click={() => (value = o.value)}
      style="padding:5px 12px; border-radius:7px; border:none; background:{active ? 'var(--surface)' : 'transparent'}; color:{active ? 'var(--text)' : 'var(--text-2)'}; font-size:12px; font-weight:{active ? 600 : 500}; box-shadow:{active ? 'var(--shadow-1)' : 'none'};"
    >
      {#if typeof o.label === "string"}
        {o.label}
      {:else}
        <svelte:component this={o.label} />
      {/if}
    </button>
  {/each}
</div>
