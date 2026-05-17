<script>
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";

  export let open = false;
  export let oldPath = "";
  export let newPath = "";
  export let clientes = [];

  const dispatch = createEventDispatcher();

  let mode = "keep";
  let selected = new Set();
  let expanded = new Set();

  $: total = clientes.length;
  $: totalFicheiros = clientes.reduce((a, c) => a + (c.ficheiros?.length || 0), 0);
  $: allSelected = total > 0 && clientes.every((c) => selected.has(c.id));

  $: if (open) {
    selected = new Set();
    expanded = new Set();
    mode = "keep";
  }

  function toggleCliente(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    selected = new Set(selected);
  }
  function toggleExpand(id) {
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    expanded = new Set(expanded);
  }
  function toggleAll() {
    if (allSelected) selected = new Set();
    else selected = new Set(clientes.map((c) => c.id));
  }

  function cancelar() {
    dispatch("cancel");
  }
  function confirmar() {
    if (mode === "keep") {
      dispatch("confirm", { action: "keep", ids: [] });
    } else if (mode === "all") {
      dispatch("confirm", { action: "delete-all", ids: clientes.map((c) => c.id) });
    } else {
      dispatch("confirm", { action: "delete-selected", ids: Array.from(selected) });
    }
  }

  $: confirmDisabled = mode === "select" && selected.size === 0;
  $: confirmLabel =
    mode === "keep" ? "Manter e continuar"
    : mode === "all" ? `Apagar tudo (${total})`
    : `Apagar selecionados (${selected.size})`;
  $: confirmVariant = mode === "keep" ? "primary" : "danger";
</script>

<Modal
  {open}
  kicker="Alteração de pasta raiz"
  title="O que fazer aos registos atuais?"
  width={620}
  on:close={cancelar}
>
  <div style="display:flex; flex-direction:column; gap:14px;">
    <div style="font-size:12.5px; color:var(--text-2); line-height:1.55;">
      Vai mudar de pasta raiz. Os clientes e ficheiros já registados (e respetivas sessões) continuam na base de dados, a menos que decida apagá-los agora.
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:10px 12px; background:var(--bg-alt); border:1px solid var(--border); border-radius:8px;">
      <div style="display:flex; align-items:center; gap:8px; min-width:0;">
        <Icon name="folder" size={13} />
        <div style="min-width:0;">
          <div style="font-size:10.5px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px;">Atual</div>
          <div class="mono" style="font-size:12px; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title={oldPath}>
            {oldPath || "—"}
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px; min-width:0;">
        <Icon name="arrow" size={13} />
        <div style="min-width:0;">
          <div style="font-size:10.5px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px;">Nova</div>
          <div class="mono" style="font-size:12px; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title={newPath}>
            {newPath || "—"}
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:6px;">
      <label class="lex-opt" class:active={mode === "keep"}>
        <input type="radio" bind:group={mode} value="keep" />
        <div style="flex:1;">
          <div class="lex-opt-title">Manter todos os registos</div>
          <div class="lex-opt-desc">Mantém clientes, ficheiros e histórico de sessões. Recomendado se a nova pasta é apenas uma reorganização.</div>
        </div>
      </label>

      <label class="lex-opt" class:active={mode === "all"}>
        <input type="radio" bind:group={mode} value="all" />
        <div style="flex:1;">
          <div class="lex-opt-title">Apagar todos os registos antigos</div>
          <div class="lex-opt-desc">Remove <span class="mono">{total}</span> cliente{total === 1 ? "" : "s"} e <span class="mono">{totalFicheiros}</span> ficheiro{totalFicheiros === 1 ? "" : "s"}, incluindo sessões associadas. Irreversível.</div>
        </div>
      </label>

      <label class="lex-opt" class:active={mode === "select"}>
        <input type="radio" bind:group={mode} value="select" />
        <div style="flex:1;">
          <div class="lex-opt-title">Escolher quais apagar</div>
          <div class="lex-opt-desc">Selecione clientes individuais. Os não selecionados são mantidos.</div>
        </div>
      </label>
    </div>

    {#if mode === "select"}
      <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--surface);">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--bg-alt); border-bottom:1px solid var(--border);">
          <label style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:var(--text-2); letter-spacing:0.4px; text-transform:uppercase; cursor:pointer;">
            <input type="checkbox" checked={allSelected} on:change={toggleAll} />
            {allSelected ? "Desmarcar tudo" : "Marcar tudo"}
          </label>
          <div style="font-size:11px; color:var(--text-3);">
            {selected.size} de {total} selecionado{selected.size === 1 ? "" : "s"}
          </div>
        </div>
        <div style="max-height:240px; overflow-y:auto;">
          {#each clientes as c (c.id)}
            <div style="border-bottom:1px solid var(--border);">
              <div style="display:flex; align-items:center; gap:10px; padding:9px 12px;">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  on:change={() => toggleCliente(c.id)}
                />
                <button
                  type="button"
                  on:click={() => toggleExpand(c.id)}
                  style="background:transparent; border:none; padding:0; color:var(--text-3); display:inline-flex; align-items:center; transform:rotate({expanded.has(c.id) ? 90 : 0}deg); transition:transform 0.12s ease;"
                  aria-label="Expandir"
                >
                  <Icon name="chevron" size={12} />
                </button>
                <Icon name="clients" size={13} />
                <div style="flex:1; min-width:0;">
                  <div style="font-size:13px; font-weight:500; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{c.nome}</div>
                  <div style="font-size:11px; color:var(--text-3);">
                    {(c.ficheiros?.length || 0)} ficheiro{(c.ficheiros?.length || 0) === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              {#if expanded.has(c.id) && c.ficheiros?.length}
                <div style="padding:0 12px 10px 50px; display:flex; flex-direction:column; gap:3px;">
                  {#each c.ficheiros as f (f.id)}
                    <div class="mono" style="font-size:11.5px; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title={f.caminho}>
                      {f.nome}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button on:click={cancelar}>Cancelar</Button>
    <Button variant={confirmVariant} disabled={confirmDisabled} on:click={confirmar}>
      {confirmLabel}
    </Button>
  </svelte:fragment>
</Modal>

<style>
  .lex-opt {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .lex-opt:hover {
    border-color: var(--border-strong);
    background: var(--bg-alt);
  }
  .lex-opt.active {
    border-color: var(--accent-line);
    background: var(--accent-soft);
    box-shadow: 0 0 0 3px oklch(0.85 0.03 250 / 0.35);
  }
  .lex-opt input[type="radio"] {
    margin-top: 2px;
    accent-color: var(--accent);
  }
  .lex-opt-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 2px;
  }
  .lex-opt-desc {
    font-size: 12px;
    color: var(--text-2);
    line-height: 1.45;
  }
</style>
