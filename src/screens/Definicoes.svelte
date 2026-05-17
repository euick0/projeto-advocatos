<script>
  import SectionHeader from "../components/SectionHeader.svelte";
  import Card from "../components/Card.svelte";
  import Button from "../components/Button.svelte";
  import Select from "../components/Select.svelte";
  import Toggle from "../components/Toggle.svelte";
  import Icon from "../components/Icon.svelte";
  import FolderChangeDialog from "../components/FolderChangeDialog.svelte";
  import {
    rootFolder, idleThresholdMin, currency, autoStart, openMinimized, defaultRule,
    saveRootFolder, saveIdleThreshold, saveCurrency, saveAutoStart, saveOpenMinimized, saveDefaultRule,
  } from "../stores/settings.js";
  import { rescan, scanning, lastScan, scanError, clientes, loadClientes } from "../stores/clientes.js";
  import { startMonitor, stopMonitor, loadSessions } from "../stores/sessoes.js";
  import { pickFolder, pickSaveFile, invoke, isTauri, setAutostart } from "../lib/tauri.js";
  import { deleteClientes, getDbInfo, getSetting, setSetting } from "../lib/db.js";
  import { isDev, detectedOs, osOverride, setOsOverride } from "../stores/os.js";
  import { onMount } from "svelte";
  import Badge from "../components/Badge.svelte";

  let dbInfo = { caminho: "—", tamanho: "—", registos: { sessoes: 0, ficheiros: 0, clientes: 0, cobrancas: 0 } };
  let ultimoBackup = "—";

  async function refreshDbInfo() {
    try { dbInfo = await getDbInfo(); } catch {}
  }
  onMount(async () => {
    await refreshDbInfo();
    try { ultimoBackup = (await getSetting("last_backup", "")) || "—"; } catch {}
  });

  let localOsOverride = $osOverride || "auto";
  $: if (localOsOverride !== ($osOverride || "auto")) {
    setOsOverride(localOsOverride === "auto" ? null : localOsOverride);
    if (typeof location !== "undefined") location.reload();
  }

  let pastaInput = "";
  let localMoeda = "EUR";
  let localAutoStart = false;
  let localOpenMin = false;
  let localTipo = "hora";
  let localValor = 110;
  let initialized = false;

  $: if (!initialized && $rootFolder !== undefined) {
    pastaInput = $rootFolder;
    localMoeda = $currency;
    localAutoStart = $autoStart;
    localOpenMin = $openMinimized;
    localTipo = $defaultRule.tipo;
    localValor = $defaultRule.valor;
    initialized = true;
  }

  $: if (initialized && $defaultRule) {
    localTipo = $defaultRule.tipo;
    if (typeof document !== "undefined" && document.activeElement?.id !== "localValorInput") {
      localValor = $defaultRule.valor;
    }
  }

  async function saveLocalPadrao() {
    await saveDefaultRule({ tipo: localTipo, valor: parseFloat(localValor) || 0 });
    await loadSessions();
  }

  $: if (initialized && localMoeda !== $currency) saveCurrency(localMoeda);
  $: if (initialized && localAutoStart !== $autoStart) {
    saveAutoStart(localAutoStart);
    setAutostart(localAutoStart);
  }
  $: if (initialized && localOpenMin !== $openMinimized) saveOpenMinimized(localOpenMin);

  let dialogOpen = false;
  let dialogOld = "";
  let dialogNew = "";
  let dialogClientes = [];
  let pendingPath = null;

  async function escolherPasta() {
    const p = await pickFolder();
    if (p) {
      await iniciarMudancaPasta(p);
    }
  }

  async function iniciarMudancaPasta(p) {
    if (!p || p === $rootFolder) return;
    const existentes = $clientes;
    if ($rootFolder && existentes.length > 0) {
      pendingPath = p;
      dialogOld = $rootFolder;
      dialogNew = p;
      dialogClientes = existentes;
      dialogOpen = true;
      return;
    }
    pastaInput = p;
    await aplicarPasta(p);
  }

  async function aplicarPasta(p) {
    await saveRootFolder(p);
    await stopMonitor();
    await rescan();
    await startMonitor();
  }

  async function onPathBlur() {
    if (pastaInput && pastaInput !== $rootFolder) {
      await iniciarMudancaPasta(pastaInput);
    }
  }

  async function onDialogConfirm(e) {
    const { action, ids } = e.detail;
    const p = pendingPath;
    dialogOpen = false;
    pendingPath = null;
    if (!p) return;
    if (action === "delete-all" || action === "delete-selected") {
      try { await deleteClientes(ids); } catch (err) { alert("Falha ao apagar: " + err); return; }
      await loadClientes();
      await loadSessions();
    }
    pastaInput = p;
    await aplicarPasta(p);
  }

  function onDialogCancel() {
    dialogOpen = false;
    pendingPath = null;
    pastaInput = $rootFolder;
  }

  async function onLimiarChange(e) {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v) && v > 0) await saveIdleThreshold(v);
  }

  async function abrirPastaDados() {
    if (!isTauri()) return alert("Apenas disponível na aplicação.");
    try { await invoke("open_data_folder"); } catch (e) { alert(String(e)); }
  }

  async function backup() {
    if (!isTauri()) return alert("Apenas disponível na aplicação.");
    const dest = await pickSaveFile("lextimer-backup.db");
    if (!dest) return;
    try {
      await invoke("backup_db", { destination: dest });
      const now = new Date().toISOString();
      await setSetting("last_backup", now);
      ultimoBackup = now;
      await refreshDbInfo();
      alert("Backup criado.");
    } catch (e) { alert("Falha: " + e); }
  }

  function fmtBackup(v) {
    if (!v || v === "—") return "nunca";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString("pt-PT");
  }
</script>

<div>
  <SectionHeader kicker="Sistema" title="Definições">
    Configuração geral da aplicação. Todas as preferências ficam guardadas localmente.
  </SectionHeader>

  <Card title="Pasta raiz dos clientes">
    <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start; border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Caminho da pasta</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5;">
          Pasta principal que contém as subpastas dos clientes. Cada subpasta de primeiro nível = um cliente. Todos os ficheiros (incluindo subpastas) ficam ligados a esse cliente. Ao alterar, a aplicação volta a fazer scan e reinicia a monitorização.
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; gap:8px; align-items:center;">
          <div style="flex:1; height:34px; padding:0 12px; border:1px solid var(--border-strong); border-radius:8px; background:var(--surface); display:flex; align-items:center; gap:8px; font-family:var(--font-mono); font-size:12px;">
            <Icon name="folder" size={13} />
            <input
              bind:value={pastaInput}
              on:blur={onPathBlur}
              on:keydown={(e) => e.key === "Enter" && onPathBlur()}
              placeholder="Escreva ou escolha uma pasta…"
              style="border:none; background:transparent; outline:none; flex:1; font-family:inherit; font-size:12px; color:var(--text);"
            />
          </div>
          <Button on:click={escolherPasta}>
            <Icon name="folder" size={13} /> Escolher…
          </Button>
          <Button on:click={() => rescan()} disabled={!$rootFolder || $scanning}>
            {$scanning ? "A analisar…" : "Re-scan"}
          </Button>
        </div>
        {#if $scanError}
          <div style="font-size:12px; color:oklch(0.5 0.18 25);">{$scanError}</div>
        {/if}
        {#if $lastScan}
          <div style="font-size:11px; color:var(--text-3);">
            Último scan: <span class="mono">{new Date($lastScan).toLocaleString("pt-PT")}</span>
            · {$clientes.length} clientes detetados
            · {$clientes.reduce((a, c) => a + (c.ficheiros?.length || 0), 0)} ficheiros
          </div>
        {:else if $clientes.length}
          <div style="font-size:11px; color:var(--text-3);">
            {$clientes.length} clientes em base · {$clientes.reduce((a, c) => a + (c.ficheiros?.length || 0), 0)} ficheiros
          </div>
        {/if}
      </div>
    </div>

    <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start;">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Limiar de inactividade</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5;">Tempo sem eventos antes de o contador ser pausado automaticamente para um ficheiro aberto.</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <input
          type="number"
          min="1"
          value={$idleThresholdMin}
          on:change={onLimiarChange}
          on:keydown={(e) => e.key === "Enter" && onLimiarChange(e)}
          style="width:120px; height:34px; padding:0 12px; border:1px solid var(--border-strong); border-radius:8px; background:var(--surface); font-family:var(--font-mono); font-size:13px;"
        />
        <span style="font-size:12px; color:var(--text-3);">minutos · recomendado: 5</span>
      </div>
    </div>
  </Card>

  <Card title="Preferências" style="margin-top:14px;">
    <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start; border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Moeda</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5;">Moeda utilizada em todos os cálculos e apresentações.</div>
      </div>
      <div>
        <Select
          bind:value={localMoeda}
          options={[
            { value: "EUR", label: "Euro (€)" },
            { value: "USD", label: "Dólar ($)" },
            { value: "GBP", label: "Libra (£)" },
            { value: "BRL", label: "Real (R$)" },
          ]}
          width={200}
        />
      </div>
    </div>

    <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start; border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Iniciar com o sistema</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5;">Abrir automaticamente o LexTimer ao iniciar sessão no computador.</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <Toggle bind:value={localAutoStart} />
        <span style="font-size:12px; color:var(--text-3);">{localAutoStart ? "Ativado" : "Desativado"}</span>
      </div>
    </div>

    <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start; border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Começar na bandeja do sistema</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5;">Ao arrancar, ocultar a janela e manter a aplicação na bandeja do sistema (Windows) ou na barra de menus (macOS). Clique no ícone da bandeja para abrir.</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <Toggle bind:value={localOpenMin} />
        <span style="font-size:12px; color:var(--text-3);">{localOpenMin ? "Ativado" : "Desativado"}</span>
      </div>
    </div>

    <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start;">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Tarifa padrão</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5;">Aplicada a ficheiros que não correspondam a nenhuma regra.</div>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <Select
          label="Tipo"
          bind:value={localTipo}
          on:change={saveLocalPadrao}
          options={[{ value: "hora", label: "Por hora" }, { value: "fixo", label: "Valor fixo" }]}
          width={140}
        />
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:600; color:var(--text-2); letter-spacing:0.4px; text-transform:uppercase;">Valor</div>
          <div style="position:relative; background:var(--surface); border:1px solid var(--border-strong); border-radius:8px; height:34px; width:140px;">
            <input
              id="localValorInput"
              type="number"
              step="10"
              bind:value={localValor}
              on:blur={saveLocalPadrao}
              on:keydown={(e) => e.key === "Enter" && saveLocalPadrao()}
              style="border:none; background:transparent; width:100%; height:100%; font-size:13px; font-family:var(--font-mono); text-align:right; padding:0 {localTipo === 'hora' ? 34 : 22}px 0 10px; box-sizing:border-box;"
            />
            <span style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--text-3); font-size:12px; pointer-events:none;">{localTipo === "hora" ? "€/h" : "€"}</span>
          </div>
        </div>
      </div>
    </div>
  </Card>

  {#if isDev}
    <Card title="Programador" style="margin-top:14px;">
      <div style="padding:18px 22px; display:grid; grid-template-columns:1fr 1.4fr; gap:32px; align-items:flex-start;">
        <div>
          <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Sistema operativo (dev)</div>
          <div style="font-size:12px; color:var(--text-2); line-height:1.5;">
            Forçar UI de Windows ou macOS para teste. SO detetado: <span class="mono">{detectedOs}</span>. Apenas disponível em modo de desenvolvimento.
          </div>
        </div>
        <div>
          <Select
            bind:value={localOsOverride}
            options={[
              { value: "auto", label: "Automático (detetado)" },
              { value: "macos", label: "macOS" },
              { value: "windows", label: "Windows" },
            ]}
            width={240}
          />
        </div>
      </div>
    </Card>
  {/if}

  <Card title="Base de dados" style="margin-top:14px;">
    <div slot="action"><Badge tone="soft"><Icon name="db" size={11} /> SQLite · local</Badge></div>
    <div style="padding:18px 22px; display:flex; flex-direction:column; gap:18px;">
      <div>
        <div style="font-size:13px; font-weight:600; margin-bottom:4px;">Localização do ficheiro</div>
        <div style="font-size:12px; color:var(--text-2); line-height:1.5; margin-bottom:10px;">
          Toda a informação da aplicação é guardada num único ficheiro SQLite. Para fazer backup, basta copiar este ficheiro para outro local.
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border-strong); border-radius:8px; background:var(--surface); font-family:var(--font-mono); font-size:12px;">
          <span style="color:var(--accent); display:flex;"><Icon name="db" size={14} /></span>
          <span style="flex:1; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{dbInfo.caminho}</span>
          <span class="mono num" style="color:var(--text-3);">{dbInfo.tamanho}</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; padding:14px 16px; border:1px solid var(--border); background:var(--bg-alt); border-radius:8px;">
        {#each [["Sessões registadas", dbInfo.registos.sessoes], ["Ficheiros vigiados", dbInfo.registos.ficheiros], ["Clientes", dbInfo.registos.clientes], ["Cobranças efectuadas", dbInfo.registos.cobrancas]] as [k, v]}
          <div>
            <div style="font-size:10px; font-weight:600; letter-spacing:0.4px; text-transform:uppercase; color:var(--text-3); margin-bottom:2px;">{k}</div>
            <div class="mono num" style="font-size:18px; font-weight:600;">{Number(v).toLocaleString("pt-PT")}</div>
          </div>
        {/each}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="font-size:12px; color:var(--text-2);">
          Último backup manual: <span class="mono">{fmtBackup(ultimoBackup)}</span>
        </div>
        <div style="display:flex; gap:8px;">
          <Button on:click={abrirPastaDados}><Icon name="external" size={13} /> Abrir pasta de dados</Button>
          <Button variant="primary" on:click={backup}><Icon name="download" size={13} /> Backup da base de dados</Button>
        </div>
      </div>
    </div>
  </Card>
</div>

<FolderChangeDialog
  open={dialogOpen}
  oldPath={dialogOld}
  newPath={dialogNew}
  clientes={dialogClientes}
  on:confirm={onDialogConfirm}
  on:cancel={onDialogCancel}
/>
