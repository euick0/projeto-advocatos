<script>
  import { onMount, onDestroy } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import TopBar from "./components/TopBar.svelte";
  import WindowsTitleBar from "./components/WindowsTitleBar.svelte";
  import WindowsSidebar from "./components/WindowsSidebar.svelte";
  import WindowsCommandBar from "./components/WindowsCommandBar.svelte";
  import WindowsStatusBar from "./components/WindowsStatusBar.svelte";
  import Dashboard from "./screens/Dashboard.svelte";
  import Clientes from "./screens/Clientes.svelte";
  import ClienteDetalhe from "./screens/ClienteDetalhe.svelte";
  import Monitorizacao from "./screens/Monitorizacao.svelte";
  import Regras from "./screens/Regras.svelte";
  import Cobrancas from "./screens/Cobrancas.svelte";
  import Analise from "./screens/Analise.svelte";
  import Definicoes from "./screens/Definicoes.svelte";
  import { screen } from "./stores/navigation.js";
  import { startTicker, stopTicker } from "./stores/monitor.js";
  import { loadSettings, rootFolder, settingsReady, autoStart, openMinimized, saveAutoStart } from "./stores/settings.js";
  import { loadClientes } from "./stores/clientes.js";
  import { loadRegras } from "./stores/regras.js";
  import { loadSessions, startMonitor, stopMonitor } from "./stores/sessoes.js";
  import { loadCobrancas } from "./stores/cobrancas.js";
  import { os } from "./stores/os.js";
  import { winHide, isAutostartEnabled, setAutostart, isTauri } from "./lib/tauri.js";

  startTicker();

  let bootError = null;
  let sidebarCollapsed = false;

  onMount(async () => {
    try {
      await loadSettings();
      await loadRegras();
      await loadClientes();
      await loadSessions();
      await loadCobrancas();
      if ($rootFolder) {
        await startMonitor();
      }
      if (isTauri()) {
        const osEnabled = await isAutostartEnabled();
        if (osEnabled !== $autoStart) {
          if ($autoStart) await setAutostart(true);
          else await saveAutoStart(osEnabled);
        }
        if ($openMinimized) {
          await winHide();
        }
      }
    } catch (e) {
      bootError = String(e);
      console.error("Boot failed:", e);
    }
  });

  onDestroy(() => {
    stopTicker();
    stopMonitor();
  });

  const SCREENS = {
    dashboard: Dashboard,
    clientes: Clientes,
    "cliente-detalhe": ClienteDetalhe,
    monitor: Monitorizacao,
    regras: Regras,
    cobrancas: Cobrancas,
    analise: Analise,
    definicoes: Definicoes,
  };

  $: isWin = $os === "windows";
</script>

{#if isWin}
  <div style="width:100vw; height:100vh; display:flex; flex-direction:column; background:var(--win-bg); overflow:hidden;">
    <WindowsTitleBar />
    <div style="flex:1; display:flex; min-height:0;">
      <WindowsSidebar bind:collapsed={sidebarCollapsed} />
      <div style="flex:1; display:flex; flex-direction:column; min-width:0; background:var(--win-content);">
        <WindowsCommandBar />
        <div style="flex:1; overflow-y:auto; padding:22px 26px 30px;">
          {#if bootError}
            <div style="padding:12px 14px; border:1px solid oklch(0.85 0.05 25); background:oklch(0.97 0.03 25); color:oklch(0.4 0.18 25); border-radius:8px; font-size:12px; margin-bottom:14px;">
              Erro de inicialização: {bootError}
            </div>
          {/if}
          {#if $settingsReady}
            <svelte:component this={SCREENS[$screen] || Dashboard} />
          {:else}
            <div style="color:var(--text-3); font-size:13px;">A carregar…</div>
          {/if}
        </div>
      </div>
    </div>
    <WindowsStatusBar />
  </div>
{:else}
  <div style="width:100vw; height:100vh; display:flex; background:var(--bg); overflow:hidden;">
    <Sidebar />
    <div style="flex:1; display:flex; flex-direction:column; min-width:0; background:var(--bg);">
      <TopBar />
      <div style="flex:1; overflow-y:auto; padding:24px 28px 32px;">
        {#if bootError}
          <div style="padding:12px 14px; border:1px solid oklch(0.85 0.05 25); background:oklch(0.97 0.03 25); color:oklch(0.4 0.18 25); border-radius:8px; font-size:12px; margin-bottom:14px;">
            Erro de inicialização: {bootError}
          </div>
        {/if}
        {#if $settingsReady}
          <svelte:component this={SCREENS[$screen] || Dashboard} />
        {:else}
          <div style="color:var(--text-3); font-size:13px;">A carregar…</div>
        {/if}
      </div>
    </div>
  </div>
{/if}
