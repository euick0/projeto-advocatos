// LexTimer — main app shell
// ROOT_FOLDER comes from data.js

const NAV = [
  { group: "Principal", items: [
    { id: "dashboard", label: "Painel", icon: IconDashboard },
    { id: "clientes", label: "Clientes", icon: IconClients },
    { id: "monitor", label: "Monitorização", icon: IconMonitor, live: true },
  ]},
  { group: "Faturação", items: [
    { id: "regras", label: "Regras de preço", icon: IconRules },
    { id: "cobrancas", label: "Cobranças", icon: IconBilling },
    { id: "analise", label: "Análise", icon: IconAnalysis },
  ]},
];

function Sidebar({ current, onNavigate, collapsed, onToggle }) {
  const W = collapsed ? 64 : 224;
  return (
    <div style={{
      width: W, flexShrink: 0,
      background: "var(--bg)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      transition: "width 0.18s ease",
    }}>
      {/* drag region with traffic lights + collapse toggle */}
      <div style={{
        height: 48, padding: "0 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
      }}>
        <TrafficLights/>
        {!collapsed && (
          <button onClick={onToggle} title="Recolher" style={{
            width: 24, height: 24, border: "none", background: "transparent",
            borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-3)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "oklch(0.94 0.005 100)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1.5" y="2.5" width="11" height="9" rx="1.5"/>
              <path d="M5.5 2.5v9"/>
            </svg>
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: collapsed ? "12px 8px 4px" : "12px 10px 4px", overflowY: "auto" }}>
        {NAV.map(grp => (
          <div key={grp.group} style={{ marginBottom: 18 }}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 0.7, textTransform: "uppercase",
                color: "var(--text-3)", padding: "6px 10px 8px",
              }}>{grp.group}</div>
            )}
            {grp.items.map(item => {
              const active = current === item.id || (item.id === "clientes" && current === "cliente-detalhe");
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)} title={collapsed ? item.label : undefined} style={{
                  width: "100%", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                  padding: collapsed ? "8px 0" : "8px 10px", marginBottom: 1,
                  borderRadius: 7,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--text)" : "var(--text-2)",
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  boxShadow: active ? "var(--shadow-1)" : "none",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                  position: "relative",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "oklch(0.96 0.005 100)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ color: active ? "var(--accent)" : "var(--text-3)", display: "flex" }}>
                    <Icon size={16}/>
                  </span>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!collapsed && item.live && <span className="live-dot" style={{ width: 6, height: 6 }}/>}
                  {collapsed && item.live && <span className="live-dot" style={{ width: 5, height: 5, position: "absolute", top: 6, right: 8 }}/>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* footer: Definições + status */}
      <div style={{ padding: collapsed ? "8px 8px 12px" : "8px 10px 12px", borderTop: "1px solid var(--border)" }}>
        <button onClick={() => onNavigate("definicoes")} title={collapsed ? "Definições" : undefined} style={{
          width: "100%", textAlign: "left",
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "8px 0" : "8px 10px", marginBottom: 6,
          borderRadius: 7,
          background: current === "definicoes" ? "var(--surface)" : "transparent",
          color: current === "definicoes" ? "var(--text)" : "var(--text-2)",
          fontSize: 13, fontWeight: current === "definicoes" ? 600 : 500,
          boxShadow: current === "definicoes" ? "var(--shadow-1)" : "none",
          border: current === "definicoes" ? "1px solid var(--border)" : "1px solid transparent",
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <span style={{ color: current === "definicoes" ? "var(--accent)" : "var(--text-3)", display: "flex" }}>
            <IconSettings size={16}/>
          </span>
          {!collapsed && "Definições"}
        </button>
        {!collapsed && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 10px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span className="live-dot"/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.1 }}>A monitorizar</div>
              <div className="mono" style={{ fontSize: 9.5, color: "var(--text-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>FSEvents · {ROOT_FOLDER.split("/").pop()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ periodo, onPeriodo, current }) {
  const titles = {
    dashboard: "Painel",
    clientes: "Clientes",
    "cliente-detalhe": "Clientes",
    monitor: "Monitorização",
    regras: "Regras de preço",
    cobrancas: "Cobranças",
    analise: "Análise",
    definicoes: "Definições",
  };
  return (
    <div style={{
      height: 48, flexShrink: 0,
      borderBottom: "1px solid var(--border)",
      background: "var(--surface-2)",
      display: "flex", alignItems: "center",
      padding: "0 18px", gap: 14,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--text-3)" }}>Advocatos</span>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ color: "var(--text)" }}>{titles[current]}</span>
      </div>

      <div style={{ flex: 1 }}/>

      {/* root folder */}
      <button style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "transparent", border: "1px dashed var(--border-strong)",
        borderRadius: 8, padding: "5px 10px",
        color: "var(--text-2)", fontSize: 11.5,
        fontFamily: "var(--font-mono)",
      }}>
        <IconFolder size={13}/>
        {ROOT_FOLDER}
        <IconChevronDown size={12} style={{ color: "var(--text-3)" }}/>
      </button>

      {/* user */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, oklch(0.55 0.1 250), oklch(0.45 0.08 250))",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.05)",
      }}>JM</div>
    </div>
  );
}

// ────────────────────── App root ──────────────────────
function App() {
  const [screen, setScreen] = React.useState("dashboard");
  const [clienteId, setClienteId] = React.useState(null);
  const [periodo, setPeriodo] = React.useState("mes");
  const [paused, setPaused] = React.useState(false);
  const [tick, setTick] = React.useState(0); // seconds since mount
  const [collapsed, setCollapsed] = React.useState(false);

  // Ticker for live counters
  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const goCliente = (id) => { setClienteId(id); setScreen("cliente-detalhe"); };

  let content;
  switch (screen) {
    case "dashboard":         content = <ScreenDashboard tick={tick} onGotoCliente={goCliente} onGotoCobrancas={() => setScreen("cobrancas")}/>; break;
    case "clientes":          content = <ScreenClientes onOpenCliente={goCliente}/>; break;
    case "cliente-detalhe":   content = <ScreenClienteDetalhe clienteId={clienteId} onBack={() => setScreen("clientes")} onGotoCobrancas={() => setScreen("cobrancas")}/>; break;
    case "monitor":           content = <ScreenMonitorizacao tick={tick} paused={paused} onTogglePause={() => setPaused(!paused)}/>; break;
    case "regras":            content = <ScreenRegras/>; break;
    case "cobrancas":         content = <ScreenCobrancas onConfirm={() => setScreen("dashboard")}/>; break;
    case "analise":           content = <ScreenAnalise/>; break;
    case "definicoes":        content = <ScreenDefinicoes/>; break;
    default:                  content = <ScreenDashboard tick={tick} onGotoCliente={goCliente} onGotoCobrancas={() => setScreen("cobrancas")}/>;
  }

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, overflow: "hidden",
    }}>
      <div style={{
        width: "100%", maxWidth: 1480, height: "100%", maxHeight: 920,
        borderRadius: 14, overflow: "hidden",
        background: "var(--bg)",
        boxShadow: "var(--shadow-window)",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
      }}>
        <Sidebar current={screen} onNavigate={(s) => { setScreen(s); }} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}/>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
          <TopBar periodo={periodo} onPeriodo={setPeriodo} current={screen}/>
          <div data-screen-label={`Advocatos · ${screen}`} style={{
            flex: 1, overflowY: "auto",
            padding: "24px 28px 32px",
          }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
