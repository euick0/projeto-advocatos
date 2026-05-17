<script>
  export let kicker = null;
  export let title;
</script>

<div style="display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:16px; gap:16px;">
  <div>
    {#if kicker}
      <div style="font-size:11px; font-weight:600; letter-spacing:0.6px; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">{kicker}</div>
    {/if}
    <h1 style="margin:0; font-family:var(--font-display); font-weight:500; font-size:26px; letter-spacing:-0.4px; color:var(--text);">{title}</h1>
    {#if $$slots.default}
      <div style="font-size:13px; color:var(--text-2); margin-top:6px; max-width:600px;">
        <slot />
      </div>
    {/if}
  </div>
  <slot name="action" />
</div>
