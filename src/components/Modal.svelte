<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  export let open = false;
  export let title = "";
  export let width = 560;
  export let closeOnBackdrop = true;
  export let kicker = null;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch("close");
  }

  function onBackdrop(e) {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) close();
  }

  function onKey(e) {
    if (open && e.key === "Escape") close();
  }

  onMount(() => window.addEventListener("keydown", onKey));
  onDestroy(() => window.removeEventListener("keydown", onKey));
</script>

{#if open}
  <div
    class="lex-modal-backdrop"
    on:click={onBackdrop}
    role="presentation"
  >
    <div
      class="lex-modal"
      style="width:min({width}px, calc(100vw - 48px));"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {#if title || $$slots.header}
        <div class="lex-modal-header">
          <slot name="header">
            <div>
              {#if kicker}
                <div class="lex-modal-kicker">{kicker}</div>
              {/if}
              <div class="lex-modal-title">{title}</div>
            </div>
          </slot>
          <button class="lex-modal-close" on:click={close} aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />
            </svg>
          </button>
        </div>
      {/if}
      <div class="lex-modal-body">
        <slot />
      </div>
      {#if $$slots.footer}
        <div class="lex-modal-footer">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .lex-modal-backdrop {
    position: fixed;
    inset: 0;
    background: oklch(0.22 0.012 260 / 0.32);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: lex-fade 0.14s ease;
  }
  .lex-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 14px);
    box-shadow: var(--shadow-window);
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: lex-pop 0.16s cubic-bezier(0.2, 0.7, 0.3, 1);
  }
  .lex-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .lex-modal-kicker {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 4px;
  }
  .lex-modal-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.25;
  }
  .lex-modal-close {
    background: transparent;
    border: none;
    color: var(--text-3);
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s ease;
  }
  .lex-modal-close:hover {
    background: var(--bg-alt);
    color: var(--text);
  }
  .lex-modal-body {
    padding: 18px 20px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }
  .lex-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-alt);
  }
  @keyframes lex-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes lex-pop {
    from { opacity: 0; transform: translateY(6px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
</style>
