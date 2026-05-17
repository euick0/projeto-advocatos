<script>
  export let label;
  export let value;
  export let unit = null;
  export let accent = false;
</script>

<div style="flex:1; min-width:0; background:{accent ? 'var(--accent)' : 'var(--surface)'}; color:{accent ? 'white' : 'var(--text)'}; border:1px solid {accent ? 'var(--accent)' : 'var(--border)'}; border-radius:12px; padding:16px 18px; box-shadow:var(--shadow-1); display:flex; flex-direction:column; gap:8px; position:relative;">
  <div style="font-size:11px; font-weight:500; letter-spacing:0.4px; text-transform:uppercase; color:{accent ? 'rgba(255,255,255,0.7)' : 'var(--text-3)'};">{label}</div>
  <div style="display:flex; align-items:baseline; gap:6px;">
    <div class="num" style="font-family:var(--font-display); font-weight:500; font-size:32px; letter-spacing:-0.8px; line-height:1;">{value}</div>
    {#if unit}
      <div style="font-size:14px; font-weight:500; color:{accent ? 'rgba(255,255,255,0.75)' : 'var(--text-3)'};">{unit}</div>
    {/if}
  </div>
  {#if $$slots.sub}
    <div style="font-size:11px; color:{accent ? 'rgba(255,255,255,0.7)' : 'var(--text-3)'}; display:flex; align-items:center; gap:5px;">
      <slot name="sub" />
    </div>
  {/if}
</div>
