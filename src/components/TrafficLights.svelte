<script>
  import { winMinimize, winToggleMaximize, winClose } from "../lib/tauri.js";

  let hover = false;
</script>

<div
  role="group"
  aria-label="Controlos da janela"
  on:mouseenter={() => (hover = true)}
  on:mouseleave={() => (hover = false)}
  style="display:flex; gap:8px; align-items:center;"
>
  <button
    on:click|stopPropagation={winClose}
    title="Fechar"
    aria-label="Fechar"
    style="width:12px; height:12px; border-radius:50%; background:#ff5f57; border:none; padding:0; cursor:pointer; box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.18); display:flex; align-items:center; justify-content:center; color:rgba(0,0,0,0.55);"
  >
    {#if hover}
      <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 1l4 4M5 1L1 5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
    {/if}
  </button>
  <button
    on:click|stopPropagation={winMinimize}
    title="Minimizar"
    aria-label="Minimizar"
    style="width:12px; height:12px; border-radius:50%; background:#febc2e; border:none; padding:0; cursor:pointer; box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.18); display:flex; align-items:center; justify-content:center; color:rgba(0,0,0,0.55);"
  >
    {#if hover}
      <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 3h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
    {/if}
  </button>
  <button
    on:click|stopPropagation={winToggleMaximize}
    title="Maximizar"
    aria-label="Maximizar"
    style="width:12px; height:12px; border-radius:50%; background:#28c840; border:none; padding:0; cursor:pointer; box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.18); display:flex; align-items:center; justify-content:center; color:rgba(0,0,0,0.55);"
  >
    {#if hover}
      <svg width="6" height="6" viewBox="0 0 6 6"><path d="M3 1v4M1 3h4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
    {/if}
  </button>
</div>
