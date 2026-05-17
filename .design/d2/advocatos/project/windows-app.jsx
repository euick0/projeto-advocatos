// Windows 11 (Fluent) shell for Advocatos
// Re-uses screens from screens.jsx, but redefines window chrome, sidebar, topbar, App

const WIN_NAV = [
{ group: "Principal", items: [
  { id: "dashboard", label: "Painel", icon: IconDashboard },
  { id: "clientes", label: "Clientes", icon: IconClients },
  { id: "monitor", label: "Monitorização", icon: IconMonitor, live: true }]
},
{ group: "Faturação", items: [
  { id: "regras", label: "Regras de preço", icon: IconRules },
  { id: "cobrancas", label: "Cobranças", icon: IconBilling },
  { id: "analise", label: "Análise", icon: IconAnalysis }]
}];


// Windows window controls (minimize, maximize, close)
function WinControls() {
  const Btn = ({ children, danger, last }) =>
  <button style={{
    width: 46, height: 32, border: "none",
    background: "transparent", color: "var(--text)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer"
  }}
  onMouseEnter={(e) => {e.currentTarget.style.background = danger ? "#c42b1c" : "rgba(0,0,0,0.05)";if (danger) e.currentTarget.style.color = "white";}}
  onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";e.currentTarget.style.color = "var(--text)";}}>
    {children}</button>;

  return (
    <div style={{ display: "flex", alignSelf: "flex-start" }}>
      <Btn>
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>
      </Btn>
      <Btn>
        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
      </Btn>
      <Btn danger>
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" /></svg>
      </Btn>
    </div>);

}

// Fluent sidebar (NavigationView)
function WinSidebar({ current, onNavigate, collapsed, onToggle }) {
  const W = collapsed ? 52 : 232;
  return (
    <div style={{
      width: W, flexShrink: 0,
      background: "var(--win-sidebar)",
      borderRight: "1px solid var(--win-border)",
      display: "flex", flexDirection: "column",
      transition: "width 0.18s ease"
    }}>
      {/* hamburger / brand */}
      <div style={{
        height: 40, padding: "0 6px", display: "flex", alignItems: "center",
        gap: 8
      }}>
        <button onClick={onToggle} style={{
          width: 40, height: 36, border: "none", background: "transparent",
          borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text)"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          
          <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.2" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
      </div>

      {/* brand */}
      <div style={{ flex: 1, padding: "2px 4px", overflowY: "auto" }}>
        {WIN_NAV.map((grp) =>
        <div key={grp.group} style={{ marginBottom: 14 }}>
            {!collapsed &&
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase",
            color: "var(--text-3)", padding: "8px 12px 6px"
          }}>{grp.group}</div>
          }
            {grp.items.map((item) => {
            const active = current === item.id || item.id === "clientes" && current === "cliente-detalhe";
            const Icon = item.icon;
            return (
              <button key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "0" : "0 12px",
                height: 36, margin: "2px 0",
                borderRadius: 5, border: "none",
                background: active ? "rgba(0,0,0,0.05)" : "transparent",
                color: "var(--text)",
                fontSize: 13, fontWeight: active ? 600 : 400,
                position: "relative",
                justifyContent: collapsed ? "center" : "flex-start"
              }}
              onMouseEnter={(e) => {if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)";}}
              onMouseLeave={(e) => {if (!active) e.currentTarget.style.background = "transparent";}}>
                
                  {active &&
                <span style={{
                  position: "absolute", left: 4, top: 8, bottom: 8,
                  width: 3, borderRadius: 2, background: "var(--accent)"
                }} />
                }
                  <span style={{ color: active ? "var(--accent)" : "var(--text-2)", display: "flex" }}>
                    <Icon size={17} />
                  </span>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!collapsed && item.live && <span className="live-dot" style={{ width: 6, height: 6 }} />}
                </button>);

          })}
          </div>
        )}
      </div>

      {/* Settings + footer */}
      <div style={{ padding: "4px 4px 10px", borderTop: "1px solid var(--win-border)" }}>
        <button onClick={() => onNavigate("definicoes")}
        title={collapsed ? "Definições" : undefined}
        style={{
          width: "100%", textAlign: "left",
          display: "flex", alignItems: "center", gap: 12,
          padding: collapsed ? "0" : "0 12px",
          height: 36, margin: "4px 0",
          borderRadius: 5, border: "none",
          background: current === "definicoes" ? "rgba(0,0,0,0.05)" : "transparent",
          color: "var(--text)",
          fontSize: 13, fontWeight: current === "definicoes" ? 600 : 400,
          position: "relative",
          justifyContent: collapsed ? "center" : "flex-start"
        }}>
            {current === "definicoes" &&
          <span style={{
            position: "absolute", left: 4, top: 8, bottom: 8,
            width: 3, borderRadius: 2, background: "var(--accent)"
          }} />
          }
            <span style={{ color: current === "definicoes" ? "var(--accent)" : "var(--text-2)", display: "flex" }}>
              <IconSettings size={17} />
            </span>
            {!collapsed && <span style={{ flex: 1 }}>Definições</span>}
          </button>
      </div>
    </div>);

}

// Windows-style top bar (title bar + command bar)
function WinTitleBar({ collapsed, current }) {
  const titles = {
    dashboard: "Painel",
    clientes: "Clientes",
    "cliente-detalhe": "Clientes",
    monitor: "Monitorização",
    regras: "Regras de preço",
    cobrancas: "Cobranças",
    analise: "Análise",
    definicoes: "Definições"
  };
  return (
    <div style={{
      height: 32, flexShrink: 0,
      display: "flex", alignItems: "stretch",
      background: "var(--win-titlebar)",
      borderBottom: "1px solid var(--win-border)",
      WebkitAppRegion: "drag",
      fontSize: 12,
      color: "var(--text-2)"
    }}>
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        padding: "0 12px", gap: 8
      }}>
        <span style={{ color: "var(--text-3)" }}>Advocatos</span>
        <span style={{ color: "var(--text-3)" }}>—</span>
        <span style={{ color: "var(--text)", fontWeight: 500 }}>{titles[current]}</span>
      </div>
      <WinControls />
    </div>);

}

function WinCommandBar({ periodo, onPeriodo }) {
  return (
    <div style={{
      height: 44, flexShrink: 0,
      borderBottom: "1px solid var(--win-border)",
      background: "var(--win-commandbar)",
      display: "flex", alignItems: "center",
      padding: "0 18px", gap: 14
    }}>
      {/* root folder */}
      <button style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface)",
        border: "1px solid var(--win-border-strong)",
        borderRadius: 4, padding: "5px 10px",
        color: "var(--text-2)", fontSize: 12,
        fontFamily: "var(--font-mono)",
        cursor: "pointer"
      }}>
        <IconFolder size={13} />
        {ROOT_FOLDER}
        <IconChevronDown size={12} style={{ color: "var(--text-3)" }} />
      </button>

      <div style={{ flex: 1 }} />

      {/* search */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>
          <IconSearch size={14} />
        </div>
        <input placeholder="Pesquisar…" style={{
          height: 30, width: 220,
          padding: "0 12px 0 32px",
          border: "1px solid var(--win-border-strong)",
          borderRadius: 4, background: "var(--surface)",
          fontSize: 12
        }} />
      </div>

      {/* user */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, oklch(0.55 0.14 250), oklch(0.42 0.1 250))",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, letterSpacing: 0.5
      }}>JM</div>
    </div>);

}

// Status bar at bottom (Windows convention)
function WinStatusBar({ paused, tick }) {
  const now = new Date(Date.now() + tick * 1000);
  const t = now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div style={{
      height: 26, flexShrink: 0,
      borderTop: "1px solid var(--win-border)",
      background: "var(--win-titlebar)",
      display: "flex", alignItems: "center",
      padding: "0 14px", gap: 16,
      fontSize: 11, color: "var(--text-2)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {paused ?
        <><span style={{ width: 7, height: 7, borderRadius: "50%", background: "oklch(0.7 0.12 60)" }} /> Pausado</> :
        <><span className="live-dot" style={{ width: 6, height: 6 }} /> A monitorizar</>
        }
      </div>
      <span style={{ color: "var(--text-3)" }}>·</span>
      <span className="mono" style={{ fontSize: 11 }}>{ROOT_FOLDER}</span>
      <div style={{ flex: 1 }} />
      <span className="mono" style={{ fontSize: 11 }}>{t}</span>
    </div>);

}

// Win App root
function WinApp() {
  const [screen, setScreen] = React.useState("dashboard");
  const [clienteId, setClienteId] = React.useState(null);
  const [periodo, setPeriodo] = React.useState("mes");
  const [paused, setPaused] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const goCliente = (id) => {setClienteId(id);setScreen("cliente-detalhe");};

  let content;
  switch (screen) {
    case "dashboard":content = <ScreenDashboard tick={tick} onGotoCliente={goCliente} onGotoCobrancas={() => setScreen("cobrancas")} />;break;
    case "clientes":content = <ScreenClientes onOpenCliente={goCliente} />;break;
    case "cliente-detalhe":content = <ScreenClienteDetalhe clienteId={clienteId} onBack={() => setScreen("clientes")} onGotoCobrancas={() => setScreen("cobrancas")} />;break;
    case "monitor":content = <ScreenMonitorizacao tick={tick} paused={paused} onTogglePause={() => setPaused(!paused)} />;break;
    case "regras":content = <ScreenRegras />;break;
    case "cobrancas":content = <ScreenCobrancas onConfirm={() => setScreen("dashboard")} />;break;
    case "analise":content = <ScreenAnalise />;break;
    case "definicoes":content = <ScreenDefinicoes />;break;
    default:content = <ScreenDashboard tick={tick} onGotoCliente={goCliente} onGotoCobrancas={() => setScreen("cobrancas")} />;
  }

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, overflow: "hidden"
    }}>
      <div style={{
        width: "100%", maxWidth: 1480, height: "100%", maxHeight: 920,
        borderRadius: 8, overflow: "hidden",
        background: "var(--win-bg)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.10), 0 24px 60px rgba(20,25,45,0.22), 0 8px 18px rgba(20,25,45,0.12)",
        display: "flex", flexDirection: "column"
      }}>
        <WinTitleBar collapsed={collapsed} current={screen} />
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <WinSidebar current={screen} onNavigate={setScreen} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--win-content)" }}>
            <WinCommandBar periodo={periodo} onPeriodo={setPeriodo} />
            <div data-screen-label={`Advocatos · ${screen}`} style={{
              flex: 1, overflowY: "auto",
              padding: "22px 26px 30px"
            }}>
              {content}
            </div>
          </div>
        </div>
        <WinStatusBar paused={paused} tick={tick} />
      </div>
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<WinApp />);