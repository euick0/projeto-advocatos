<script>
  import Icon from "./Icon.svelte";
  import TrafficLights from "./TrafficLights.svelte";
  import { screen, navigate } from "../stores/navigation.js";
  import { rootFolder } from "../stores/settings.js";
  import { monitorStatus, monitorPaused } from "../stores/sessoes.js";

  const NAV = [
    { group: "Principal", items: [
      { id: "dashboard", label: "Painel", icon: "dashboard" },
      { id: "clientes", label: "Clientes", icon: "clients" },
      { id: "monitor", label: "Monitorização", icon: "monitor", live: true },
    ]},
    { group: "Faturação", items: [
      { id: "regras", label: "Regras de preço", icon: "rules" },
      { id: "cobrancas", label: "Cobranças", icon: "billing" },
      { id: "analise", label: "Análise", icon: "analysis" },
    ]},
  ];

  $: current = $screen;
  $: settingsActive = current === "definicoes";
  $: rootLeaf = ($rootFolder || "").split(/[\\\/]/).filter(Boolean).pop() || "—";
  $: watching = $monitorStatus === "watching" && !$monitorPaused;
  $: statusLabel = !$rootFolder
    ? "Sem pasta"
    : $monitorStatus === "error"
      ? "Erro"
      : $monitorPaused
        ? "Pausada"
        : $monitorStatus === "watching"
          ? "A monitorizar"
          : "Inactiva";
</script>

<div style="width:224px; flex-shrink:0; background:var(--bg); border-right:1px solid var(--border); display:flex; flex-direction:column;">
  <div data-tauri-drag-region style="height:48px; padding:0 16px; display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--border);">
    <TrafficLights />
  </div>


  <div style="flex:1; padding:4px 10px; overflow-y:auto;">
    {#each NAV as grp}
      <div style="margin-bottom:18px;">
        <div style="font-size:10px; font-weight:600; letter-spacing:0.7px; text-transform:uppercase; color:var(--text-3); padding:6px 10px 8px;">
          {grp.group}
        </div>
        {#each grp.items as item}
          {@const active = current === item.id || (item.id === "clientes" && current === "cliente-detalhe")}
          <button
            on:click={() => navigate(item.id)}
            class="nav-btn"
            class:active
          >
            <span style="color:{active ? 'var(--accent)' : 'var(--text-3)'}; display:flex;">
              <Icon name={item.icon} size={16} />
            </span>
            <span style="flex:1;">{item.label}</span>
            {#if item.live}
              <span class="live-dot" style="width:6px; height:6px;"></span>
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </div>

  <div style="padding:8px 10px 12px; border-top:1px solid var(--border);">
    <button
      on:click={() => navigate("definicoes")}
      class="nav-btn"
      class:active={settingsActive}
      style="margin-bottom:6px;"
    >
      <span style="color:{settingsActive ? 'var(--accent)' : 'var(--text-3)'}; display:flex;">
        <Icon name="settings" size={16} />
      </span>
      Definições
    </button>
    <button
      on:click={() => navigate("monitor")}
      style="width:100%; text-align:left; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:8px 10px; display:flex; align-items:center; gap:8px; cursor:pointer;"
    >
      {#if watching}
        <span class="live-dot"></span>
      {:else}
        <span style="width:7px; height:7px; border-radius:50%; background:var(--border-strong); display:inline-block;"></span>
      {/if}
      <div style="flex:1; min-width:0;">
        <div style="font-size:11px; font-weight:600; line-height:1.1;">{statusLabel}</div>
        <div class="mono" style="font-size:9.5px; color:var(--text-3); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          {rootLeaf}
        </div>
      </div>
    </button>
  </div>
</div>

<style>
  .nav-btn {
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    margin-bottom: 1px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.1s;
  }
  .nav-btn:hover:not(.active) {
    background: oklch(0.96 0.005 100);
  }
  .nav-btn.active {
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    box-shadow: var(--shadow-1);
    border-color: var(--border);
  }
</style>
