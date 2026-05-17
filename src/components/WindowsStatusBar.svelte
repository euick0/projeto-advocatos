<script>
  import { onMount, onDestroy } from "svelte";
  import { rootFolder } from "../stores/settings.js";
  import { monitorStatus, monitorPaused } from "../stores/sessoes.js";

  let now = new Date();
  let tickId = null;

  onMount(() => {
    tickId = setInterval(() => (now = new Date()), 1000);
  });
  onDestroy(() => { if (tickId) clearInterval(tickId); });

  $: paused = $monitorPaused;
  $: watching = $monitorStatus === "watching" && !paused;
  $: statusLabel = !$rootFolder
    ? "Sem pasta"
    : $monitorStatus === "error"
      ? "Erro"
      : paused
        ? "Pausado"
        : $monitorStatus === "watching"
          ? "A monitorizar"
          : "Inactivo";
  $: timeStr = now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
</script>

<div style="height:26px; flex-shrink:0; border-top:1px solid var(--win-border); background:var(--win-titlebar); display:flex; align-items:center; padding:0 14px; gap:16px; font-size:11px; color:var(--text-2);">
  <div style="display:flex; align-items:center; gap:6px;">
    {#if watching}
      <span class="live-dot" style="width:6px; height:6px;"></span>
      <span>A monitorizar</span>
    {:else if paused}
      <span style="width:7px; height:7px; border-radius:50%; background:oklch(0.7 0.12 60); display:inline-block;"></span>
      <span>Pausado</span>
    {:else}
      <span style="width:7px; height:7px; border-radius:50%; background:var(--border-strong); display:inline-block;"></span>
      <span>{statusLabel}</span>
    {/if}
  </div>
  <span style="color:var(--text-3);">·</span>
  <span class="mono" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:420px;">{$rootFolder || "—"}</span>
  <div style="flex:1;"></div>
  <span class="mono" style="font-size:11px;">{timeStr}</span>
</div>
