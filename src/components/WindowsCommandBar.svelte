<script>
  import Icon from "./Icon.svelte";
  import FolderChangeDialog from "./FolderChangeDialog.svelte";
  import { screen, navigate, goCliente } from "../stores/navigation.js";
  import { rootFolder, saveRootFolder } from "../stores/settings.js";
  import { pickFolder } from "../lib/tauri.js";
  import { rescan, clientes, loadClientes } from "../stores/clientes.js";
  import { startMonitor, stopMonitor, loadSessions } from "../stores/sessoes.js";
  import { deleteClientes } from "../lib/db.js";
  import { searchIndex, runSearch } from "../stores/search.js";

  let search = "";
  let open = false;
  let active = 0;
  let inputEl;

  let dialogOpen = false;
  let dialogOld = "";
  let dialogNew = "";
  let dialogClientes = [];
  let pendingPath = null;

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

  async function aplicarPasta(p) {
    await saveRootFolder(p);
    await stopMonitor();
    await rescan();
    await startMonitor();
  }

  async function escolherPasta() {
    const p = await pickFolder();
    if (!p || p === $rootFolder) return;
    const existentes = $clientes;
    if ($rootFolder && existentes.length > 0) {
      pendingPath = p;
      dialogOld = $rootFolder;
      dialogNew = p;
      dialogClientes = existentes;
      dialogOpen = true;
      return;
    }
    await aplicarPasta(p);
  }

  async function onDialogConfirm(e) {
    const { action, ids } = e.detail;
    const p = pendingPath;
    dialogOpen = false;
    pendingPath = null;
    if (!p) return;
    if (action === "delete-all" || action === "delete-selected") {
      try { await deleteClientes(ids); } catch (err) { alert("Falha ao apagar: " + err); return; }
      await loadClientes();
      await loadSessions();
    }
    await aplicarPasta(p);
  }

  function onDialogCancel() {
    dialogOpen = false;
    pendingPath = null;
  }

  $: rootLabel = $rootFolder || "— sem pasta definida —";
</script>

<div style="height:44px; flex-shrink:0; border-bottom:1px solid var(--win-border); background:var(--win-commandbar); display:flex; align-items:center; padding:0 18px; gap:14px;">
  <button
    on:click={escolherPasta}
    title={$rootFolder ? "Clique para mudar pasta raiz" : "Definir pasta raiz"}
    style="display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--win-border-strong); border-radius:4px; padding:5px 10px; color:var(--text-2); font-size:12px; font-family:var(--font-mono); cursor:pointer; max-width:340px; min-width:0;"
  >
    <Icon name="folder" size={13} />
    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0;">{rootLabel}</span>
    <span style="color:var(--text-3); display:flex; flex-shrink:0;"><Icon name="chevron-down" size={12} /></span>
  </button>

  <div style="flex:1;"></div>

  <div style="position:relative;">
    <div style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-3); display:flex; pointer-events:none; z-index:1;">
      <Icon name="search" size={14} />
    </div>
    <input
      bind:this={inputEl}
      type="text"
      bind:value={search}
      on:input={onInput}
      on:focus={() => (open = search.trim().length > 0)}
      on:blur={() => setTimeout(() => (open = false), 120)}
      on:keydown={onKeydown}
      placeholder="Pesquisar clientes e ficheiros…"
      autocomplete="off"
      spellcheck="false"
      style="height:30px; width:{open ? 340 : 220}px; padding:0 12px 0 32px; border:1px solid {open ? 'var(--accent)' : 'var(--win-border-strong)'}; border-radius:4px; background:var(--surface); font-size:12px; color:var(--text); transition:width 0.15s;"
    />
    {#if open}
      <div class="wsearch-dropdown">
        {#if results.length === 0}
          <div class="wsearch-empty">Sem resultados para “{search.trim()}”</div>
        {:else}
          {#each results as r, i (r.type + (r.caminho || r.clienteId))}
            <button
              type="button"
              class="wsearch-item"
              class:active={i === active}
              on:mouseenter={() => (active = i)}
              on:mousedown|preventDefault={() => pick(r)}
            >
              <span class="wsi-icon">
                <Icon name={r.type === "cliente" ? "clients" : "folder"} size={13} />
              </span>
              <span class="wsi-text">
                <span class="wsi-label">{r.label}</span>
                <span class="wsi-sub">{r.sub}</span>
              </span>
              <span class="wsi-tag">{r.type === "cliente" ? "Cliente" : "Ficheiro"}</span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <button
    on:click={() => navigate("definicoes")}
    title="Definições"
    style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg, oklch(0.55 0.14 250), oklch(0.42 0.1 250)); color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; letter-spacing:0.5px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.05); border:none; cursor:pointer;"
  >
    JM
  </button>
</div>

<FolderChangeDialog
  open={dialogOpen}
  oldPath={dialogOld}
  newPath={dialogNew}
  clientes={dialogClientes}
  on:confirm={onDialogConfirm}
  on:cancel={onDialogCancel}
/>

<style>
  .wsearch-dropdown {
    position: absolute;
    top: 36px;
    right: 0;
    width: 340px;
    max-height: 380px;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--win-border-strong);
    border-radius: 4px;
    box-shadow: 0 8px 28px oklch(0 0 0 / 0.18);
    padding: 4px;
    z-index: 100;
  }
  .wsearch-empty {
    padding: 14px 12px;
    font-size: 12px;
    color: var(--text-3);
    text-align: center;
  }
  .wsearch-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 9px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-ui);
    color: var(--text);
  }
  .wsearch-item.active {
    background: var(--accent-soft);
  }
  .wsi-icon {
    color: var(--text-3);
    display: flex;
    flex-shrink: 0;
  }
  .wsearch-item.active .wsi-icon {
    color: var(--accent);
  }
  .wsi-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .wsi-label {
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wsi-sub {
    font-size: 10.5px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wsi-tag {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--text-3);
    background: var(--bg-alt);
    border: 1px solid var(--win-border);
    border-radius: 4px;
    padding: 2px 6px;
  }
</style>
