<script>
  export let variant = "default";
  export let size = "md";
  export let disabled = false;
  export let type = "button";
  export let style = "";

  const variants = {
    default: "background:var(--surface); color:var(--text); border-color:var(--border-strong); box-shadow:var(--shadow-1);",
    primary: "background:var(--accent); color:white; border-color:var(--accent); box-shadow:var(--shadow-1);",
    ghost: "background:transparent; color:var(--text-2); border-color:transparent;",
    danger: "background:var(--surface); color:oklch(0.5 0.18 25); border-color:oklch(0.85 0.05 25);",
  };
  $: base = `display:inline-flex; align-items:center; gap:8px; font-size:${size === "sm" ? 12 : 13}px; font-weight:500; height:${size === "sm" ? 28 : 34}px; padding:0 ${size === "sm" ? 10 : 13}px; border-radius:8px; border:1px solid transparent; transition:all 0.12s ease; white-space:nowrap;`;
  $: disabledStyle = disabled ? "opacity:0.5; cursor:not-allowed;" : "";
</script>

<button {type} {disabled} on:click style="{base} {variants[variant]} {disabledStyle} {style}">
  <slot />
</button>
