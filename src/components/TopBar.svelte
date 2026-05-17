<script>
  import Icon from "./Icon.svelte";
  import { screen, navigate, goCliente } from "../stores/navigation.js";
  import { rootFolder, saveRootFolder } from "../stores/settings.js";
  import { pickFolder } from "../lib/tauri.js";
  import { rescan } from "../stores/clientes.js";
  import { startMonitor, stopMonitor } from "../stores/sessoes.js";
  import { searchIndex, runSearch } from "../stores/search.js";

  let search = "";
  let open = false;
  let active = 0;
  let inputEl;

  $: results = open ? runSearch($searchIndex, search) : [];
  $: if (active >= results.length) active = 0;

  function onInput() {
    open = search.trim().length > 0;
    active = 0;
  }

  function pick(r) {
    if (!r) return;
    if (r.type === "cliente") goCliente(r.clienteId);
    else goCliente(r.clienteId, r.caminho);
    search = "";
    open = false;
    inputEl?.blur();
  }

  function onKeydown(e) {
    if (!open || results.length === 0) {
      if (e.key === "ArrowDown" && search.trim()) open = true;
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      active = (active + 1) % results.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = (active - 1 + results.length) % results.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      open = false;
      inputEl?.blur();
    }
  }

  const TITLES = {
    dashboard: "Painel",
    clientes: "Clientes",
    "cliente-detalhe": "Clientes",
    monitor: "Monitorização",
    regras: "Regras de preço",
    cobrancas: "Cobranças",
    analise: "Análise",
    definicoes: "Definições",
  };


  async function escolherPasta() {
    const p = await pickFolder();
    if (!p) return;
    await saveRootFolder(p);
    await stopMonitor();
    await rescan();
    await startMonitor();
  }
</script>

<div data-tauri-drag-region style="height:48px; flex-shrink:0; border-bottom:1px solid var(--border); background:var(--surface-2); display:flex; align-items:center; padding:0 18px; gap:14px;">
  <div data-tauri-drag-region style="font-size:12.5px; font-weight:600; color:var(--text-2); display:flex; align-items:center; gap:8px;">
    <span style="color:var(--text-3);">Advocatos</span>
    <span style="color:var(--text-3);">/</span>
    <span style="color:var(--text);">{TITLES[$screen] || ""}</span>
  </div>

  <div style="flex:1;"></div>

  <div class="search-wrap" class:open>
    <div class="search-icon">
      <Icon name="search" size={13} />
    </div>
    <input
      bind:this={inputEl}
      type="text"
      class="search-input"
      bind:value={search}
      on:input={onInput}
      on:focus={() => (open = search.trim().length > 0)}
      on:blur={() => setTimeout(() => (open = false), 120)}
      on:keydown={onKeydown}
      placeholder="Pesquisar clientes e ficheiros…"
      autocomplete="off"
      spellcheck="false"
    />
    {#if open}
      <div class="search-dropdown">
        {#if results.length === 0}
          <div class="search-empty">Sem resultados para “{search.trim()}”</div>
        {:else}
          {#each results as r, i (r.type + (r.caminho || r.clienteId))}
            <button
              type="button"
              class="search-item"
              class:active={i === active}
              on:mouseenter={() => (active = i)}
              on:mousedown|preventDefault={() => pick(r)}
            >
              <span class="si-icon">
                <Icon name={r.type === "cliente" ? "clients" : "folder"} size={13} />
              </span>
              <span class="si-text">
                <span class="si-label">{r.label}</span>
                <span class="si-sub">{r.sub}</span>
              </span>
              <span class="si-tag">{r.type === "cliente" ? "Cliente" : "Ficheiro"}</span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <button
    on:click={escolherPasta}
    title={$rootFolder ? "Clique para mudar pasta raiz" : "Definir pasta raiz"}
    style="display:flex; align-items:center; gap:8px; background:transparent; border:1px dashed var(--border-strong); border-radius:8px; padding:5px 10px; color:var(--text-2); font-size:11.5px; font-family:var(--font-mono); cursor:pointer; max-width:340px; min-width:0;"
  >
    <Icon name="folder" size={13} />
    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0;">
      {$rootFolder || "— sem pasta definida —"}
    </span>
    <span style="color:var(--text-3); display:flex; flex-shrink:0;"><Icon name="chevron-down" size={12} /></span>
  </button>

  <button
    on:click={() => navigate("definicoes")}
    title="Definições"
    style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg, oklch(0.55 0.1 250), oklch(0.45 0.08 250)); color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; letter-spacing:0.5px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.05); border:none; cursor:pointer;"
  >
    JM
  </button>
</div>

<style>
  .search-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .search-icon {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    display: flex;
    pointer-events: none;
    transition: color 0.15s;
  }
  .search-input {
    height: 28px;
    width: 200px;
    padding: 0 12px 0 30px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    font-size: 12px;
    color: var(--text);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .search-input::placeholder {
    color: var(--text-3);
  }
  .search-input:hover {
    border-color: var(--accent-line);
  }
  .search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px oklch(0.42 0.08 250 / 0.12);
  }
  .search-wrap:focus-within .search-icon {
    color: var(--text-2);
  }
  .search-wrap.open .search-input {
    width: 320px;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px oklch(0.42 0.08 250 / 0.12);
  }

  .search-dropdown {
    position: absolute;
    top: 34px;
    left: 0;
    right: 0;
    min-width: 320px;
    max-height: 380px;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    box-shadow: 0 8px 28px oklch(0 0 0 / 0.16);
    padding: 4px;
    z-index: 100;
  }
  .search-empty {
    padding: 14px 12px;
    font-size: 12px;
    color: var(--text-3);
    text-align: center;
  }
  .search-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 9px;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-ui);
    color: var(--text);
  }
  .search-item.active {
    background: var(--accent-soft);
  }
  .si-icon {
    color: var(--text-3);
    display: flex;
    flex-shrink: 0;
  }
  .search-item.active .si-icon {
    color: var(--accent);
  }
  .si-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .si-label {
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .si-sub {
    font-size: 10.5px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .si-tag {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--text-3);
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 2px 6px;
  }
</style>
