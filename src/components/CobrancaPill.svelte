<script>
  import Badge from "./Badge.svelte";
  export let estado = "por-cobrar"; // por-cobrar | cobrado | parcial
</script>

{#if estado === "cobrado"}
  <Badge tone="soft">
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 4.8L3.6 6.8 7.6 2.4" /></svg>
    Cobrado
  </Badge>
{:else if estado === "parcial"}
  <Badge tone="warn">Parcial</Badge>
{:else}
  <Badge tone="warn">Por cobrar</Badge>
{/if}
