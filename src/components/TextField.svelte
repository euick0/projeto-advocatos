<script>
  export let label = null;
  export let value = "";
  export let placeholder = "";
  export let prefix = null;
  export let suffix = null;
  export let mono = false;
  export let type = "text";
  export let width = null;
  export let style = "";
</script>

<div style="display:flex; flex-direction:column; gap:6px; {width ? `width:${width}px;` : ''}">
  {#if label}
    <div style="font-size:11px; font-weight:600; color:var(--text-2); letter-spacing:0.4px; text-transform:uppercase;">{label}</div>
  {/if}
  <div style="display:flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border-strong); border-radius:8px; padding:0 10px; height:34px; {style}">
    {#if prefix}<span style="color:var(--text-3); font-size:12px;">{prefix}</span>{/if}
    <input
      {type}
      {value}
      {placeholder}
      on:input={(e) => (value = e.currentTarget.value)}
      style="border:none; background:transparent; flex:1; font-size:13px; color:var(--text); height:100%; font-family:{mono ? 'var(--font-mono)' : 'inherit'}; font-variant-numeric:{mono ? 'tabular-nums' : 'normal'};"
    />
    {#if suffix}<span style="color:var(--text-3); font-size:12px;">{suffix}</span>{/if}
  </div>
</div>
