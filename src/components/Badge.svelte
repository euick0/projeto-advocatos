<script>
  export let tone = "neutral";
  export let style = "";

  const tones = {
    neutral: { bg: "oklch(0.96 0.005 100)", fg: "var(--text-2)", border: "var(--border)" },
    accent: { bg: "var(--accent-soft)", fg: "var(--accent)", border: "var(--accent-line)" },
    live: { bg: "var(--live-soft)", fg: "oklch(0.42 0.12 155)", border: "oklch(0.85 0.07 155)" },
    warn: { bg: "oklch(0.97 0.04 80)", fg: "oklch(0.45 0.1 60)", border: "oklch(0.88 0.07 80)" },
    soft: { bg: "var(--bg-alt)", fg: "var(--text-2)", border: "var(--border)" },
  };
  $: t = tones[tone] || tones.neutral;
</script>

<span style="display:inline-flex; align-items:center; gap:5px; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:500; letter-spacing:0.05px; background:{t.bg}; color:{t.fg}; border:1px solid {t.border}; {style}">
  <slot />
</span>
