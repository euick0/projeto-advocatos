<script>
  import Icon from "./Icon.svelte";
  import { screen, navigate } from "../stores/navigation.js";
  import { monitorStatus, monitorPaused } from "../stores/sessoes.js";

  export let collapsed = false;

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
  $: watching = $monitorStatus === "watching" && !$monitorPaused;

  function toggle() { collapsed = !collapsed; }
</script>

<div
  style="width:{collapsed ? 52 : 232}px; flex-shrink:0; background:var(--win-sidebar); border-right:1px solid var(--win-border); display:flex; flex-direction:column; transition:width 0.18s ease;"
>
  <div style="height:40px; padding:0 6px; display:flex; align-items:center; gap:8px;">
    <button
      on:click={toggle}
      title={collapsed ? "Expandir" : "Recolher"}
      aria-label="Alternar barra lateral"
      class="toggle-btn"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.2" fill="none">
        <path d="M2 4h12M2 8h12M2 12h12" stroke-linecap="round"/>
      </svg>
    </button>
  </div>


  <div style="flex:1; padding:2px 4px; overflow-y:auto;">
    {#each NAV as grp}
      <div style="margin-bottom:14px;">
        {#if !collapsed}
          <div style="font-size:10.5px; font-weight:600; letter-spacing:0.4px; text-transform:uppercase; color:var(--text-3); padding:8px 12px 6px;">
            {grp.group}
          </div>
        {/if}
        {#each grp.items as item}
          {@const active = current === item.id || (item.id === "clientes" && current === "cliente-detalhe")}
          <button
            on:click={() => navigate(item.id)}
            title={collapsed ? item.label : null}
            class="nav-btn"
            class:active
            style="gap:12px; padding:{collapsed ? '0' : '0 12px'}; justify-content:{collapsed ? 'center' : 'flex-start'};"
          >
            {#if active}
              <span class="active-bar"></span>
            {/if}
            <span style="color:{active ? 'var(--accent)' : 'var(--text-2)'}; display:flex;">
              <Icon name={item.icon} size={17} />
            </span>
            {#if !collapsed}
              <span style="flex:1;">{item.label}</span>
              {#if item.live}<span class="live-dot" style="width:6px; height:6px;"></span>{/if}
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </div>

  <div style="padding:4px 4px 10px; border-top:1px solid var(--win-border);">
    <button
      on:click={() => navigate("definicoes")}
      title={collapsed ? "Definições" : null}
      class="nav-btn"
      class:active={settingsActive}
      style="gap:12px; padding:{collapsed ? '0' : '0 12px'}; justify-content:{collapsed ? 'center' : 'flex-start'};"
    >
      {#if settingsActive}
        <span class="active-bar"></span>
      {/if}
      <span style="color:{settingsActive ? 'var(--accent)' : 'var(--text-2)'}; display:flex;">
        <Icon name="settings" size={17} />
      </span>
      {#if !collapsed}<span style="flex:1;">Definições</span>{/if}
    </button>
  </div>
</div>

<style>
  .toggle-btn {
    width: 40px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
    cursor: pointer;
    transition: background 0.1s;
  }
  .toggle-btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .nav-btn {
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    height: 36px;
    margin: 2px 0;
    border-radius: 5px;
    border: none;
    background: transparent;
    color: var(--text);
    font-size: 13px;
    font-weight: 400;
    position: relative;
    cursor: pointer;
    transition: background 0.1s;
  }
  .nav-btn:hover:not(.active) {
    background: rgba(0, 0, 0, 0.04);
  }
  .nav-btn.active {
    background: rgba(0, 0, 0, 0.05);
    font-weight: 600;
  }

  .active-bar {
    position: absolute;
    left: 4px;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 2px;
    background: var(--accent);
  }
</style>
