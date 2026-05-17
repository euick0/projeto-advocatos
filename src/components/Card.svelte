<script>
  export let title = null;
  export let padding = 18;
  export let style = "";
  export let headerStyle = "";
</script>

<div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-1); {style}">
  {#if title}
    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border); {headerStyle}">
      <div style="font-size:13px; font-weight:600; color:var(--text); letter-spacing:0.1px;">{title}</div>
      <slot name="action" />
    </div>
    <div>
      <slot />
    </div>
  {:else}
    <div style="padding:{padding}px;">
      <slot />
    </div>
  {/if}
</div>
