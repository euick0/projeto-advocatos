<script>
  // Manual hours correction dialog (spec 6.4). The três campos (início, fim,
  // duração) stay synchronised: editing the duration recomputes fim from início;
  // editing início/fim recomputes the duração.
  import { createEventDispatcher } from "svelte";
  import Modal from "./Modal.svelte";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";
  import { fmtEuro } from "../lib/format.js";

  export let open = false;
  // session: a closed db session row { id, inicio, fim, duracao_seg, valor,
  //   valor_original, corrigido_em, ficheiro_nome, cliente_nome }
  export let session = null;
  export let regraLabel = "";
  // priceFn(durSeg) -> number: recompute value for a new duration.
  export let priceFn = (sec) => 0;

  const dispatch = createEventDispatcher();

  function fmtClock(mins) {
    mins = Math.max(0, Math.round(mins));
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  function parseClock(s) {
    if (!s) return null;
    const m = String(s).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    return h * 60 + mm;
  }

  let initStart = 0, initDur = 0;
  let start = 0, dur = 0;
  let startStr = "00:00", endStr = "00:00";
  let durH = 0, durM = 0;
  let lastId = null;

  // Re-seed state whenever a new session is opened.
  $: if (session && session.id !== lastId) {
    lastId = session.id;
    const d = new Date(session.inicio);
    initStart = d.getHours() * 60 + d.getMinutes();
    initDur = Math.round((session.duracao_seg || 0) / 60);
    start = initStart;
    dur = initDur;
    startStr = fmtClock(start);
    endStr = fmtClock(start + dur);
    durH = Math.floor(dur / 60);
    durM = dur % 60;
  }

  function onStart(v) {
    startStr = v;
    const p = parseClock(v);
    if (p == null) return;
    start = p;
    endStr = fmtClock(start + dur);
  }
  function onEnd(v) {
    endStr = v;
    const p = parseClock(v);
    if (p == null) return;
    const d = Math.max(0, p - start);
    dur = d;
    durH = Math.floor(d / 60);
    durM = d % 60;
  }
  function onDurField(h, m) {
    const d = Math.max(0, (Number(h) || 0) * 60 + Math.min(59, Number(m) || 0));
    dur = d;
    durH = Math.floor(d / 60);
    durM = d % 60;
    endStr = fmtClock(start + d);
  }

  $: valorOrig = session ? (session.valor_original != null ? session.valor_original : session.valor || 0) : 0;
  $: valorNovo = priceFn(dur * 60);
  $: delta = valorNovo - valorOrig;
  $: changed = !!session && (dur !== initDur || start !== initStart);

  function save() {
    if (!session || !changed) return;
    const base = new Date(session.inicio);
    base.setHours(Math.floor(start / 60), start % 60, 0, 0);
    const duracaoSeg = dur * 60;
    const fim = new Date(base.getTime() + duracaoSeg * 1000);
    dispatch("save", {
      inicioIso: base.toISOString(),
      fimIso: fim.toISOString(),
      duracaoSeg,
    });
  }
</script>

<Modal {open} kicker="Corrigir horas da sessão" title={session?.ficheiro_nome || ""} width={500} on:close={() => dispatch("close")}>
  {#if session}
    <div class="sub">
      <span>{session.cliente_nome}</span>
      <span class="dot">·</span>
      <span>{new Date(session.inicio).toLocaleDateString("pt-PT")}</span>
      {#if regraLabel}
        <span class="dot">·</span>
        <span class="mono">{regraLabel}</span>
      {/if}
      {#if session.corrigido_em}
        <span class="dot">·</span>
        <span style="color:oklch(0.55 0.1 60);">corrigida em {new Date(session.corrigido_em).toLocaleDateString("pt-PT")}</span>
      {/if}
    </div>

    <div class="grid2">
      <div>
        <div class="lbl">Hora de início</div>
        <input class="fld mono" value={startStr} on:input={(e) => onStart(e.target.value)} placeholder="HH:MM" />
      </div>
      <div>
        <div class="lbl">Hora de fim</div>
        <input class="fld mono" value={endStr} on:input={(e) => onEnd(e.target.value)} placeholder="HH:MM" />
      </div>
    </div>

    <div style="margin-top:14px;">
      <div class="lbl">Duração total</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <input class="fld mono" style="width:80px; text-align:right;" type="number" min="0" value={durH} on:input={(e) => onDurField(e.target.value, durM)} />
        <span class="unit">h</span>
        <input class="fld mono" style="width:80px; text-align:right;" type="number" min="0" max="59" value={durM} on:input={(e) => onDurField(durH, e.target.value)} />
        <span class="unit">min</span>
        <span style="font-size:11px; color:var(--text-3); margin-left:8px; line-height:1.4;">
          Os três campos sincronizam-se: alterar a duração recalcula a hora de fim a partir do início.
        </span>
      </div>
    </div>

    <div class="recap">
      <div class="recap-row">
        <span style="color:var(--text-3);">Valor original (preservado para auditoria)</span>
        <span class="mono num">{fmtEuro(valorOrig)}</span>
      </div>
      <div class="recap-row">
        <span style="color:var(--text-3);">Diferença</span>
        <span class="mono num" style="font-weight:600; color:{delta < 0 ? 'oklch(0.5 0.18 25)' : delta > 0 ? 'oklch(0.42 0.12 155)' : 'var(--text-3)'};">
          {delta === 0 ? "—" : (delta >= 0 ? "+" : "−") + fmtEuro(Math.abs(delta))}
        </span>
      </div>
      <div class="recap-row total">
        <span>Valor recalculado</span>
        <span class="mono num">{fmtEuro(valorNovo)}</span>
      </div>
    </div>

    <div style="font-size:11px; color:var(--text-3); line-height:1.45; margin-top:12px;">
      A correcção fica registada na base de dados com a data/hora desta alteração. Os totais do ficheiro e do cliente são recalculados em cascata.
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <Button on:click={() => dispatch("close")}>Cancelar</Button>
    <Button variant="primary" disabled={!changed} on:click={save}>
      <Icon name="check" size={14} stroke={2} /> Guardar correcção
    </Button>
  </svelte:fragment>
</Modal>

<style>
  .sub {
    font-size: 12px;
    color: var(--text-3);
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .dot { opacity: 0.5; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .lbl {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-2);
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .fld {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    text-align: center;
  }
  .fld:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px oklch(0.42 0.08 250 / 0.12);
  }
  .unit { font-size: 12px; color: var(--text-3); width: 22px; }
  .recap {
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 14px;
  }
  .recap-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }
  .recap-row.total {
    border-top: 1px dashed var(--border-strong);
    padding-top: 8px;
    margin-top: 2px;
    font-size: 13.5px;
    font-weight: 700;
  }
</style>
