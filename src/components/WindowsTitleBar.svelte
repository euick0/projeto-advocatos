<script>
  import { onMount, onDestroy } from "svelte";
  import { screen } from "../stores/navigation.js";
  import { winMinimize, winToggleMaximize, winClose, winIsMaximized, winOnResize, isTauri } from "../lib/tauri.js";

  const TITLES = {
    dashboard: "Painel",
    clientes: "Clientes",
    "cliente-detalhe": "Clientes",
    cobrancas: "Cobranças",
    monitor: "Monitorização",
    regras: "Regras de preço",
    analise: "Análise",
    definicoes: "Definições",
  };

  let maximized = false;
  let unlisten = null;

  async function refresh() {
    if (!isTauri()) return;
    try { maximized = await winIsMaximized(); } catch {}
  }

  onMount(async () => {
    await refresh();
    if (isTauri()) {
      try { unlisten = await winOnResize(() => refresh()); } catch {}
    }
  });

  onDestroy(() => { if (unlisten) unlisten(); });

  async function onMin() { await winMinimize(); }
  async function onMax() { await winToggleMaximize(); await refresh(); }
  async function onClose() { await winClose(); }

  function onDoubleClick(e) {
    if (e.target.closest("button")) return;
    onMax();
  }
</script>

<div
  data-tauri-drag-region
  on:dblclick={onDoubleClick}
  style="height:32px; flex-shrink:0; display:flex; align-items:stretch; background:var(--win-titlebar); border-bottom:1px solid var(--win-border); font-size:12px; color:var(--text-2); user-select:none;"
>
  <div data-tauri-drag-region style="flex:1; display:flex; align-items:center; padding:0 12px; gap:8px; min-width:0;">
    <div style="width:16px; height:16px; border-radius:4px; background:var(--accent); color:white; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:600; font-size:10px; letter-spacing:-0.3px; flex-shrink:0;">A</div>
    <span style="color:var(--text-3); white-space:nowrap;">Advocatos</span>
    <span style="color:var(--text-3);">—</span>
    <span style="color:var(--text); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{TITLES[$screen] || ""}</span>
  </div>

  <div style="display:flex; flex-shrink:0;">
    <button class="win-ctrl" on:click={onMin} title="Minimizar" aria-label="Minimizar">
      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" stroke-width="1" fill="none"/></svg>
    </button>
    <button class="win-ctrl" on:click={onMax} title={maximized ? "Restaurar" : "Maximizar"} aria-label={maximized ? "Restaurar" : "Maximizar"}>
      {#if maximized}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="2.5" y="0.5" width="7" height="7"/>
          <rect x="0.5" y="2.5" width="7" height="7" fill="var(--win-titlebar)"/>
        </svg>
      {:else}
        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>
      {/if}
    </button>
    <button class="win-ctrl win-ctrl-close" on:click={onClose} title="Fechar" aria-label="Fechar">
      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" stroke-width="1" fill="none"/></svg>
    </button>
  </div>
</div>

<style>
  .win-ctrl {
    width: 46px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.1s ease, color 0.1s ease;
  }
  .win-ctrl:hover { background: rgba(0, 0, 0, 0.05); }
  .win-ctrl-close:hover { background: #c42b1c; color: white; }
</style>
