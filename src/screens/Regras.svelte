<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Card from "../components/Card.svelte";
  import Badge from "../components/Badge.svelte";
  import Button from "../components/Button.svelte";
  import Select from "../components/Select.svelte";
  import Icon from "../components/Icon.svelte";
  import { regras, addRegra, removeRegra, moveRegra, persistRegras, updateRegra } from "../stores/regras.js";
  import { defaultRule, saveDefaultRule } from "../stores/settings.js";
  import { loadSessions } from "../stores/sessoes.js";
  import { fmtEuro } from "../lib/format.js";

  let adding = false;
  let novaPalavra = "";
  let novoTipo = "hora";
  let novoValor = "";
  let addError = "";

  let editingId = null;
  let editPalavra = "";
  let editTipo = "hora";
  let editValor = "";
  let editError = "";

  let dragIdx = null;
  let dragOverIdx = null;

  function onDragStart(e, i) {
    dragIdx = i;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", i.toString());
    }
  }

  function onDragOver(e, i) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    dragOverIdx = i;
  }


  function onDragEnd() {
    dragIdx = null;
    dragOverIdx = null;
  }

  let padraoTipo = "hora";
  let padraoValor = 110;

  $: if ($defaultRule) {
    padraoTipo = $defaultRule.tipo;
    if (typeof document !== "undefined" && document.activeElement?.id !== "padraoValorInput") {
      padraoValor = $defaultRule.valor;
    }
  }

  async function savePadrao() {
    await saveDefaultRule({ tipo: padraoTipo, valor: parseFloat(padraoValor) || 0 });
    await loadSessions();
  }

  let opError = "";

  async function submit() {
    addError = "";
    const palavra = novaPalavra.trim().toLowerCase();
    if (!palavra) { addError = "Palavra-chave obrigatória."; return; }
    const v = parseFloat(novoValor);
    if (!novoValor || isNaN(v) || v <= 0) { addError = "Valor deve ser maior que zero."; return; }
    if ($regras.some(r => r.palavra === palavra)) { addError = "Palavra-chave já existe."; return; }
    try {
      await addRegra({ palavra, tipo: novoTipo, valor: v });
      await loadSessions();
      novaPalavra = ""; novoValor = ""; novoTipo = "hora"; adding = false; addError = ""; opError = "";
    } catch (e) {
      addError = "Erro ao guardar: " + (e?.message ?? String(e));
    }
  }

  function startEdit(r) {
    editingId = r.id;
    editPalavra = r.palavra;
    editTipo = r.tipo;
    editValor = String(r.valor);
    editError = "";
  }

  function cancelEdit() {
    editingId = null; editPalavra = ""; editTipo = "hora"; editValor = ""; editError = "";
  }

  async function submitEdit() {
    editError = "";
    const palavra = editPalavra.trim().toLowerCase();
    if (!palavra) { editError = "Palavra-chave obrigatória."; return; }
    const v = parseFloat(editValor);
    if (!editValor || isNaN(v) || v <= 0) { editError = "Valor deve ser maior que zero."; return; }
    if ($regras.some(r => r.palavra === palavra && r.id !== editingId)) { editError = "Palavra-chave já existe."; return; }
    try {
      await updateRegra(editingId, { palavra, tipo: editTipo, valor: v });
      await loadSessions();
      cancelEdit();
      opError = "";
    } catch (e) {
      editError = "Erro ao guardar: " + (e?.message ?? String(e));
    }
  }

  async function handleRemove(id) {
    opError = "";
    try {
      await removeRegra(id);
      await loadSessions();
    } catch (e) {
      opError = "Erro ao eliminar: " + (e?.message ?? String(e));
    }
  }

  async function handleMove(idx, dir) {
    opError = "";
    try {
      await moveRegra(idx, dir);
      await loadSessions();
    } catch (e) {
      opError = "Erro ao reordenar: " + (e?.message ?? String(e));
    }
  }

  async function handleDrop(e, i) {
    e.preventDefault();
    const raw = e.dataTransfer?.getData("text/plain");
    const src = raw !== "" && raw != null ? parseInt(raw, 10) : dragIdx;
    dragIdx = null;
    dragOverIdx = null;
    if (src === null || isNaN(src) || src === i) return;
    const arr = [...$regras];
    const [moved] = arr.splice(src, 1);
    arr.splice(i, 0, moved);
    opError = "";
    try {
      await persistRegras(arr);
      await loadSessions();
    } catch (err) {
      opError = "Erro ao reordenar: " + (err?.message ?? String(err));
    }
  }

  const iconBtnStyle = (disabled) =>
    `width:28px; height:28px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:${disabled ? 'var(--text-3)' : 'var(--text-2)'}; cursor:${disabled ? 'not-allowed' : 'pointer'}; display:inline-flex; align-items:center; justify-content:center; opacity:${disabled ? 0.5 : 1}; font-size:12px;`;

  const GRID = "grid-template-columns:32px 28px 1fr 160px 160px 108px;";
</script>

<div>
  <SectionHeader kicker="Faturação" title="Regras de preço">
    <svelte:fragment slot="action">
      <Button variant="primary" on:click={() => (adding = true)}>
        <Icon name="plus" size={14} />
        Nova regra
      </Button>
    </svelte:fragment>
    Cada regra associa uma palavra-chave do nome do ficheiro a uma tarifa. As regras são avaliadas por ordem de prioridade.
  </SectionHeader>

  {#if opError}
    <div style="background:oklch(0.97 0.04 25); border:1px solid oklch(0.85 0.05 25); color:oklch(0.5 0.18 25); padding:10px 14px; border-radius:8px; font-size:12px; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
      <span style="flex:1;">{opError}</span>
      <button on:click={() => (opError = "")} style="background:none; border:none; cursor:pointer; color:inherit; opacity:0.7; font-size:14px;">✕</button>
    </div>
  {/if}

  <Card>
    <div style="display:grid; {GRID} padding:10px 18px; background:var(--bg-alt); border-bottom:1px solid var(--border); font-size:11px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-3); border-radius:12px 12px 0 0;">
      <div></div>
      <div>#</div>
      <div>Palavra-chave</div>
      <div>Tipo</div>
      <div style="text-align:right;">Valor</div>
      <div style="text-align:right;">Acções</div>
    </div>
    {#each $regras as r, i}
      {#if editingId === r.id}
        <div style="display:grid; {GRID} padding:12px 18px; align-items:center; gap:12px; background:var(--accent-soft); border-bottom:{i === $regras.length - 1 ? 'none' : '1px solid var(--border)'};">
          <div></div>
          <div class="mono" style="color:var(--accent); font-size:12px;">{i + 1}</div>
          <input
            autofocus
            bind:value={editPalavra}
            on:keydown={(e) => e.key === "Enter" && submitEdit()}
            on:keydown={(e) => e.key === "Escape" && cancelEdit()}
            style="height:32px; padding:0 10px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); font-family:var(--font-mono); font-size:12.5px;"
          />
          <Select
            bind:value={editTipo}
            options={[{ value: "hora", label: "Por hora" }, { value: "fixo", label: "Valor fixo" }]}
          />
          <input
            type="number"
            step="10"
            bind:value={editValor}
            on:keydown={(e) => e.key === "Enter" && submitEdit()}
            on:keydown={(e) => e.key === "Escape" && cancelEdit()}
            style="height:32px; padding:0 12px 0 10px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); font-family:var(--font-mono); font-size:12.5px; text-align:right;"
          />
          <div style="display:flex; gap:4px; justify-content:flex-end; flex-direction:column; align-items:flex-end;">
            <div style="display:flex; gap:4px;">
              <button on:click={submitEdit} style="{iconBtnStyle(false)} background:var(--accent); color:white; border:none;" title="Guardar">
                <Icon name="check" size={13} stroke={2} />
              </button>
              <button on:click={cancelEdit} style={iconBtnStyle(false)} title="Cancelar">✕</button>
            </div>
            {#if editError}<div style="font-size:10px; color:var(--red,#e53); white-space:nowrap;">{editError}</div>{/if}
          </div>
        </div>
      {:else}
        <div
          draggable="true"
          on:dragstart={(e) => onDragStart(e, i)}
          on:dragenter={(e) => e.preventDefault()}
          on:dragover={(e) => onDragOver(e, i)}
          on:drop={(e) => handleDrop(e, i)}
          on:dragend={onDragEnd}
          style="display:grid; {GRID} padding:12px 18px; align-items:center; border-bottom:{i === $regras.length - 1 ? 'none' : '1px solid var(--border)'}; gap:12px; opacity:{dragIdx === i ? 0.4 : 1}; border-top:{dragOverIdx === i && dragIdx !== i ? '2px solid var(--accent)' : (i === 0 ? 'none' : '')}; transition:opacity 0.15s;"
        >
          <div style="color:var(--text-3); display:flex; align-items:center; justify-content:center; cursor:grab;">
            <Icon name="drag" size={14} />
          </div>
          <div class="mono" style="color:var(--text-3); font-size:12px;">{i + 1}</div>
          <div style="display:flex; align-items:center; gap:10px;">
            <Badge tone="accent">{r.palavra}</Badge>
            <span style="font-size:12px; color:var(--text-3);">contém em <span class="mono">nome.ext</span></span>
          </div>
          <div>
            <Badge tone="soft">{r.tipo === "hora" ? "Por hora" : "Valor fixo"}</Badge>
          </div>
          <div class="mono num" style="text-align:right; font-weight:600; font-size:13px; padding-right:12px;">
            {fmtEuro(r.valor)}{#if r.tipo === "hora"}<span style="color:var(--text-3); font-weight:400;"> /h</span>{/if}
          </div>
          <div style="display:flex; gap:4px; justify-content:flex-end;">
            <button on:click={() => handleMove(i, -1)} disabled={i === 0} style={iconBtnStyle(i === 0)} title="Subir">
              <Icon name="arrow-up" size={13} />
            </button>
            <button on:click={() => handleMove(i, 1)} disabled={i === $regras.length - 1} style={iconBtnStyle(i === $regras.length - 1)} title="Descer">
              <Icon name="arrow-down" size={13} />
            </button>
            <button on:click={() => startEdit(r)} style={iconBtnStyle(false)} title="Editar">
              <Icon name="edit" size={13} />
            </button>
            <button on:click={() => handleRemove(r.id)} style={iconBtnStyle(false)} title="Eliminar">
              <Icon name="trash" size={13} />
            </button>
          </div>
        </div>
      {/if}
    {/each}
    {#if $regras.length === 0 && !adding}
      <div style="padding:24px; text-align:center; color:var(--text-3); font-size:12.5px;">Sem regras. Adicione uma nova ou usa-se a tarifa padrão.</div>
    {/if}
    {#if adding}
      <div style="display:grid; {GRID} padding:12px 18px; align-items:center; gap:12px; background:var(--accent-soft); border-top:1px solid var(--accent-line);">
        <div></div>
        <div class="mono" style="color:var(--accent); font-size:12px;">{$regras.length + 1}</div>
        <input
          autofocus
          bind:value={novaPalavra}
          placeholder="ex: minuta"
          on:keydown={(e) => e.key === "Enter" && submit()}
          style="height:32px; padding:0 10px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); font-family:var(--font-mono); font-size:12.5px;"
        />
        <Select
          bind:value={novoTipo}
          options={[{ value: "hora", label: "Por hora" }, { value: "fixo", label: "Valor fixo" }]}
        />
        <input
          type="number"
          step="10"
          bind:value={novoValor}
          placeholder="0,00"
          on:keydown={(e) => e.key === "Enter" && submit()}
          style="height:32px; padding:0 12px 0 10px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); font-family:var(--font-mono); font-size:12.5px; text-align:right;"
        />
        <div style="display:flex; gap:4px; justify-content:flex-end; flex-direction:column; align-items:flex-end;">
          <div style="display:flex; gap:4px;">
            <button on:click={submit} style="{iconBtnStyle(false)} background:var(--accent); color:white; border:none;" title="Adicionar">
              <Icon name="check" size={13} stroke={2} />
            </button>
            <button on:click={() => { adding = false; novaPalavra = ""; novoValor = ""; addError = ""; }} style={iconBtnStyle(false)} title="Cancelar">
              ✕
            </button>
          </div>
          {#if addError}<div style="font-size:10px; color:var(--red,#e53); white-space:nowrap;">{addError}</div>{/if}
        </div>
      </div>
    {/if}
  </Card>

  <Card title="Tarifa padrão" style="margin-top:14px;">
    <div slot="action"><Badge tone="soft">Aplicada quando nenhuma regra corresponde</Badge></div>
    <div style="padding:18px; display:flex; align-items:center; gap:24px;">
      <div style="flex:1;">
        <div style="font-size:13px; color:var(--text-2); margin-bottom:4px;">
          Garante que nenhum ficheiro fica sem valorização.
        </div>
      </div>
      <div style="display:flex; gap:10px; align-items:flex-end;">
        <Select
          label="Tipo"
          bind:value={padraoTipo}
          on:change={savePadrao}
          options={[{ value: "hora", label: "Por hora" }, { value: "fixo", label: "Valor fixo" }]}
          width={140}
        />
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:600; color:var(--text-2); letter-spacing:0.4px; text-transform:uppercase;">Valor</div>
          <div style="position:relative; background:var(--surface); border:1px solid var(--border-strong); border-radius:8px; height:34px; width:140px;">
            <input
              id="padraoValorInput"
              type="number"
              step="10"
              bind:value={padraoValor}
              on:blur={savePadrao}
              on:keydown={(e) => e.key === "Enter" && savePadrao()}
              style="border:none; background:transparent; width:100%; height:100%; font-size:13px; font-family:var(--font-mono); text-align:right; padding:0 {padraoTipo === 'hora' ? 34 : 22}px 0 10px; box-sizing:border-box;"
            />
            <span style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--text-3); font-size:12px; pointer-events:none;">{padraoTipo === "hora" ? "€/h" : "€"}</span>
          </div>
        </div>
      </div>
    </div>
  </Card>
</div>
