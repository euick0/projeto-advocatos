<script>
  export let value = false;
</script>

<button
  on:click={() => (value = !value)}
  style="width:38px; height:22px; border-radius:999px; background:{value ? 'var(--accent)' : 'var(--border-strong)'}; border:none; padding:2px; position:relative; transition:background 0.15s ease;"
>
  <div style="width:18px; height:18px; border-radius:50%; background:white; transform:translateX({value ? 16 : 0}px); transition:transform 0.15s ease; box-shadow:0 1px 3px rgba(0,0,0,0.18);"></div>
</button>
