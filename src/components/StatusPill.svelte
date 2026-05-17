<script>
  import Badge from "./Badge.svelte";
  export let estado;
</script>

{#if estado === "aberto"}
  <Badge tone="live">
    <span class="live-dot"></span>
    Aberto
  </Badge>
{:else}
  <Badge tone="soft">Fechado</Badge>
{/if}
