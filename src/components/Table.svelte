<script>
  export let style = "";
</script>

<div style="width:100%; overflow-x:auto; {style}">
  <table class="lex-table">
    <slot />
  </table>
</div>

<style>
  :global(.lex-table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  :global(.lex-table thead th) {
    text-align: left;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text-3);
    border-bottom: 1px solid var(--border);
    background: var(--bg-alt);
    white-space: nowrap;
  }
  :global(.lex-table thead th.right) { text-align: right; }
  :global(.lex-table tbody td) {
    text-align: left;
    padding: 12px 16px;
    color: var(--text);
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }
  :global(.lex-table tbody tr:last-child td) { border-bottom: none; }
  :global(.lex-table tbody td.right) { text-align: right; }
  :global(.lex-table tbody td.mono) {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 12.5px;
  }
  :global(.lex-table tbody tr.clickable) {
    cursor: pointer;
    transition: background 0.1s ease;
  }
  :global(.lex-table tbody tr.clickable:hover) {
    background: var(--bg-alt);
  }
</style>
