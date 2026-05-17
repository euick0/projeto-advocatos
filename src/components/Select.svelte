<script>
  import { createEventDispatcher } from "svelte";
  import Icon from "./Icon.svelte";

  export let value;
  export let options = [];
  export let label = null;
  export let width = null;

  const dispatch = createEventDispatcher();

  let open = false;
  let triggerEl;
  let listEl;
  let focusedIdx = -1;

  $: selectedOption = options.find(o => o.value === value);
  $: if (open) focusedIdx = options.findIndex(o => o.value === value);

  function toggle() {
    open = !open;
  }

  function select(o) {
    value = o.value;
    open = false;
    dispatch("change", { value });
  }

  function handleKeydown(e) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        open = true;
      }
      return;
    }
    if (e.key === "Escape") {
      open = false;
      triggerEl?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusedIdx = Math.min(focusedIdx + 1, options.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusedIdx = Math.max(focusedIdx - 1, 0);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIdx >= 0) select(options[focusedIdx]);
    } else if (e.key === "Tab") {
      open = false;
    }
  }

  function handleOutsideClick(e) {
    if (!triggerEl?.contains(e.target) && !listEl?.contains(e.target)) {
      open = false;
    }
  }
</script>

<svelte:window on:mousedown={handleOutsideClick} />

<div class="select-wrap" style="{width ? `width:${width}px;` : ''}">
  {#if label}
    <div class="select-label">{label}</div>
  {/if}
  <div class="select-inner">
    <button
      bind:this={triggerEl}
      class="select-trigger"
      class:open
      on:click={toggle}
      on:keydown={handleKeydown}
      aria-haspopup="listbox"
      aria-expanded={open}
      type="button"
    >
      <span class="select-value">{selectedOption?.label ?? ""}</span>
      <span class="select-icon" class:rotated={open}>
        <Icon name="chevron-down" size={14} stroke={1.8} />
      </span>
    </button>

    {#if open}
      <div
        bind:this={listEl}
        class="select-dropdown"
        role="listbox"
      >
        {#each options as o, i}
          <div
            class="select-option"
            class:selected={o.value === value}
            class:focused={i === focusedIdx}
            role="option"
            aria-selected={o.value === value}
            on:mousedown|preventDefault={() => select(o)}
            on:mouseenter={() => (focusedIdx = i)}
          >
            <span class="option-label">{o.label}</span>
            {#if o.value === value}
              <span class="option-check">
                <Icon name="check" size={13} stroke={2.5} />
              </span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .select-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .select-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-2);
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .select-inner {
    position: relative;
  }
  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 34px;
    padding: 0 10px 0 12px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    font-size: 13px;
    font-family: var(--font-ui);
    color: var(--text);
    cursor: pointer;
    text-align: left;
    gap: 6px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .select-trigger:hover {
    border-color: var(--accent-line);
  }
  .select-trigger:focus,
  .select-trigger.open {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px oklch(0.42 0.08 250 / 0.12);
  }
  .select-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .select-icon {
    color: var(--text-3);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    transition: transform 0.18s ease, color 0.15s;
  }
  .select-trigger:hover .select-icon,
  .select-trigger.open .select-icon {
    color: var(--text-2);
  }
  .select-icon.rotated {
    transform: rotate(180deg);
  }
  .select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    min-width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-2);
    z-index: 200;
    padding: 4px;
    animation: drop-in 0.13s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes drop-in {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 13px;
    font-family: var(--font-ui);
    color: var(--text);
    cursor: pointer;
    user-select: none;
    transition: background 0.09s;
    gap: 8px;
  }
  .select-option.focused,
  .select-option:hover {
    background: var(--accent-soft);
  }
  .select-option.selected {
    color: var(--accent);
    font-weight: 500;
  }
  .option-label {
    flex: 1;
  }
  .option-check {
    color: var(--accent);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
</style>
