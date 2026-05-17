// All screens for Advocatos
// Data globals (CLIENTES, SESSOES, etc.) come from data.js

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function ScreenDashboard({ tick, onGotoCliente, onGotoCobrancas }) {
  // Totais derivados — métricas conforme novo spec
  const totalPorCobrar = CLIENTES.reduce((a, c) => a + c.valorPorCobrar, 0);
  const totalCobrado = CLIENTES.reduce((a, c) => a + c.valorCobrado, 0);
  const totalHoras = CLIENTES.reduce((a, c) => a + c.horas, 0);
  const ficheirosEmCurso = SESSOES.filter(s => s.estado === "aberto").length;
  const ficheirosPorCobrar = CLIENTES.reduce((a, c) => a + c.ficheirosPorCobrar, 0);

  return (
    <div>
      <SectionHeader kicker="Geral" title="Painel">
        Visão geral do mês de Maio · 1 a 9 de Maio de 2026
      </SectionHeader>

      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <Metric
          label="Total por cobrar"
          value={fmtNumber(totalPorCobrar / 1000, 2)} unit="k €"
          accent
          sub={<>{ficheirosPorCobrar} ficheiros em {CLIENTES.filter(c => c.valorPorCobrar > 0).length} clientes</>}
        />
        <Metric
          label="Ficheiros em curso"
          value={ficheirosEmCurso} unit={ficheirosEmCurso === 1 ? "sessão activa" : "sessões activas"}
          sub={<><span className="live-dot" style={{ width: 6, height: 6 }}/> a decorrer agora</>}
        />
        <Metric
          label="Total cobrado este mês"
          value={fmtNumber(totalCobrado / 1000, 2)} unit="k €"
          sub="Já marcado como cobrado em Maio"
        />
        <Metric
          label="Horas trabalhadas"
          value={fmtNumber(totalHoras, 1)} unit="h"
          sub={<><IconArrowUp size={11} stroke={2}/> +12,4% vs. semana anterior</>}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <Card title="Actividade recente" action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge tone="soft">Hoje · 9 Mai</Badge>
            <Button variant="ghost" size="sm">Ver tudo <IconArrow size={14}/></Button>
          </div>
        }>
          <Table
            columns={[
              { label: "Ficheiro", key: "ficheiro", render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: r.estado === "aberto" ? "var(--live-soft)" : "var(--bg-alt)",
                    color: r.estado === "aberto" ? "oklch(0.42 0.12 155)" : "var(--text-3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid " + (r.estado === "aberto" ? "oklch(0.85 0.07 155)" : "var(--border)"),
                    flexShrink: 0,
                  }}>
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M2 1.5h5.5L10.5 4.5v8c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5v-11c0-.3.2-.5.5-.5z"/>
                      <path d="M7 1.5v3h3"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>{r.ficheiro}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1, fontFamily: "var(--font-mono)" }}>{r.regra}</div>
                  </div>
                </div>
              ) },
              { label: "Cliente", render: (r) => CLIENTES.find(c => c.id === r.clienteId)?.nome || "—" },
              { label: "Duração", align: "right", mono: true, render: (r) => r.estado === "aberto"
                ? <span style={{ color: "oklch(0.42 0.12 155)" }}>{r.duracao}</span>
                : <span>{r.duracao}</span> },
              { label: "Valor", align: "right", mono: true, render: (r) => (
                <span style={{ fontWeight: r.cobranca === "por-cobrar" ? 600 : 500, color: r.cobranca === "por-cobrar" ? "var(--text)" : "var(--text-2)" }}>{fmtEuro(r.valor)}</span>
              ) },
              { label: "Cobrança", align: "right", render: (r) => <CobrancaPill estado={r.cobranca}/> },
              { label: "Sessão", align: "right", render: (r) => <StatusPill estado={r.estado}/> },
            ]}
            rows={SESSOES.slice(0, 8)}
          />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Por cobrar — por cliente" action={
            <Button variant="ghost" size="sm" onClick={onGotoCobrancas}>Ir para cobranças <IconArrow size={14}/></Button>
          }>
            <div style={{ padding: "8px 0" }}>
              {CLIENTES.filter(c => c.valorPorCobrar > 0).sort((a, b) => b.valorPorCobrar - a.valorPorCobrar).slice(0, 5).map((c, i, arr) => {
                const max = Math.max(...arr.map(c => c.valorPorCobrar));
                const pct = (c.valorPorCobrar / max) * 100;
                return (
                  <div key={c.id} onClick={() => onGotoCliente(c.id)} style={{
                    padding: "10px 18px", display: "flex", flexDirection: "column", gap: 6,
                    cursor: "pointer", transition: "background 0.1s",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-alt)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.nome}</div>
                      <div className="mono num" style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.45 0.1 60)" }}>{fmtEuro(c.valorPorCobrar, 0)}</div>
                    </div>
                    <div style={{ height: 4, background: "var(--bg-alt)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: "oklch(0.7 0.12 60)" }}/>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                      <span>{c.ficheirosPorCobrar} ficheiros</span>
                      <span>Cobrado: {fmtEuro(c.valorCobrado, 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Distribuição por tipo">
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { tipo: "Contrato",    valor: 9420, pct: 29 },
                { tipo: "Parecer",     valor: 7180, pct: 22 },
                { tipo: "Petição",     valor: 6240, pct: 19 },
                { tipo: "Recurso",     valor: 4870, pct: 15 },
                { tipo: "Procuração",  valor: 2380, pct:  7 },
                { tipo: "Outros",      valor: 2291, pct:  8 },
              ].map(t => (
                <div key={t.tipo} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 80, fontSize: 12, color: "var(--text-2)" }}>{t.tipo}</div>
                  <div style={{ flex: 1, height: 6, background: "var(--bg-alt)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: t.pct * 2.6 + "%", height: "100%", background: "oklch(0.62 0.07 250)" }}/>
                  </div>
                  <div className="mono num" style={{ width: 60, textAlign: "right", fontSize: 11, color: "var(--text-2)" }}>{fmtEuro(t.valor, 0)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CLIENTES (lista) + DETALHE
// ════════════════════════════════════════════════════════════
function ScreenClientes({ onOpenCliente }) {
  const [query, setQuery] = React.useState("");
  const filtered = CLIENTES.filter(c => c.nome.toLowerCase().includes(query.toLowerCase()));
  const totalPorCobrar = CLIENTES.reduce((a, c) => a + c.valorPorCobrar, 0);
  const totalCobrado = CLIENTES.reduce((a, c) => a + c.valorCobrado, 0);
  const totalFicheiros = CLIENTES.reduce((a, c) => a + c.ficheiros, 0);

  return (
    <div>
      <SectionHeader kicker="Clientes" title="Carteira de clientes">
        Detectados automaticamente a partir das subpastas em <span className="mono" style={{ color: "var(--text)" }}>{ROOT_FOLDER}</span>
      </SectionHeader>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Metric label="Clientes activos" value={CLIENTES.length} unit="no período"/>
        <Metric label="Total ficheiros" value={totalFicheiros} unit="registados"/>
        <Metric label="Total cobrado" value={fmtNumber(totalCobrado / 1000, 2)} unit="k €"/>
        <Metric label="Total por cobrar" value={fmtNumber(totalPorCobrar / 1000, 2)} unit="k €" accent/>
      </div>

      <Card title="Lista de clientes" action={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>
              <IconSearch size={14}/>
            </div>
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar cliente…"
              style={{
                background: "var(--bg-alt)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "0 12px 0 32px", height: 30,
                fontSize: 12, width: 220,
              }}
            />
          </div>
          <Badge tone="soft">{filtered.length} de {CLIENTES.length}</Badge>
        </div>
      }>
        <Table
          onRowClick={(r) => onOpenCliente(r.id)}
          columns={[
            { label: "Cliente", render: (r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 600, fontSize: 12, letterSpacing: 0.5,
                  border: "1px solid var(--accent-line)",
                }}>{r.nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{r.nome}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>/{r.nome.toLowerCase().replace(/[^a-z]+/g, "-")}</div>
                </div>
              </div>
            ) },
            { label: "Ficheiros", align: "right", mono: true, render: (r) => r.ficheiros },
            { label: "Horas", align: "right", mono: true, render: (r) => fmtNumber(r.horas, 1) + " h" },
            { label: "Total no período", align: "right", mono: true, render: (r) => <span style={{ color: "var(--text-2)" }}>{fmtEuro(r.valor)}</span> },
            { label: "Por cobrar", align: "right", render: (r) => (
              r.valorPorCobrar > 0 ? (
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <span className="mono num" style={{ fontSize: 13, fontWeight: 700, color: "oklch(0.45 0.1 60)" }}>{fmtEuro(r.valorPorCobrar)}</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{r.ficheirosPorCobrar} ficheiros</span>
                </div>
              ) : <Badge tone="soft">Tudo cobrado</Badge>
            ) },
            { label: "", align: "right", width: 24, render: () => <span style={{ color: "var(--text-3)" }}><IconChevron size={14}/></span> },
          ]}
          rows={filtered}
        />
      </Card>
    </div>
  );
}

function ScreenClienteDetalhe({ clienteId, onBack, onGotoCobrancas }) {
  const cliente = CLIENTES.find(c => c.id === clienteId);
  const ficheiros = CLIENTE_FICHEIROS[clienteId] || CLIENTE_FICHEIROS.c3; // fallback to c3 mock
  const sessoes = CLIENTE_SESSOES[clienteId] || CLIENTE_SESSOES.c3;

  if (!cliente) return null;

  const porCobrarFich = ficheiros.filter(f => f.cobranca === "por-cobrar");
  const porCobrarValor = porCobrarFich.reduce((a, f) => a + f.valor, 0);
  const cobradoValor = ficheiros.filter(f => f.cobranca === "cobrado").reduce((a, f) => a + f.valor, 0);
  const totalValor = ficheiros.reduce((a, f) => a + f.valor, 0);
  const totalHoras = ficheiros.reduce((a, f) => a + f.horas, 0);
  const totalSessoes = ficheiros.reduce((a, f) => a + f.sessoes, 0);

  return (
    <div>
      <button onClick={onBack} style={{
        background: "transparent", border: "none", color: "var(--text-3)",
        fontSize: 12, padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ transform: "rotate(180deg)", display: "flex" }}><IconChevron size={12}/></span>
        Clientes
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: "var(--accent-soft)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 600, fontSize: 18, letterSpacing: 0.5,
            border: "1px solid var(--accent-line)",
          }}>{cliente.nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Cliente</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 26, letterSpacing: -0.4 }}>{cliente.nome}</h1>
            <div className="mono" style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{ROOT_FOLDER}/{cliente.nome.toLowerCase().replace(/[^a-z]+/g, "-")}/</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button>Abrir pasta <IconExternal size={13}/></Button>
          {porCobrarValor > 0 && (
            <Button variant="primary" icon={<IconBilling size={14}/>} onClick={onGotoCobrancas}>
              Cobrar {fmtEuro(porCobrarValor, 0)}
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Metric label="Ficheiros" value={ficheiros.length} unit="registados"/>
        <Metric label="Horas no período" value={fmtNumber(totalHoras, 1)} unit="h"/>
        <Metric label="Cobrado" value={fmtNumber(cobradoValor / 1000, 2)} unit="k €"/>
        <Metric label="Por cobrar" value={fmtNumber(porCobrarValor / 1000, 2)} unit="k €" accent/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
        <Card title="Ficheiros do cliente" action={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Badge tone="warn">{porCobrarFich.length} por cobrar</Badge>
            <Badge tone="soft">{ficheiros.length - porCobrarFich.length} cobrados</Badge>
          </div>
        }>
          <Table
            columns={[
              { label: "Ficheiro", render: (r) => (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>{r.ficheiro}</div>
                  <div style={{ marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                    <Badge tone={r.tipo === "—" ? "soft" : "accent"}>{r.tipo}</Badge>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{r.regra}</span>
                  </div>
                </div>
              ) },
              { label: "Sessões", align: "right", mono: true, render: (r) => r.sessoes },
              { label: "Horas", align: "right", mono: true, render: (r) => fmtNumber(r.horas, 1) },
              { label: "Valor", align: "right", mono: true, render: (r) => <span style={{ fontWeight: 600 }}>{fmtEuro(r.valor)}</span> },
              { label: "Cobrança", align: "right", render: (r) => <CobrancaPill estado={r.cobranca}/> },
            ]}
            rows={ficheiros}
          />
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", background: "var(--bg-alt)", borderRadius: "0 0 12px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Total do cliente</div>
            <div style={{ display: "flex", gap: 32 }}>
              <div className="mono num" style={{ fontSize: 12, color: "var(--text-2)" }}>{totalSessoes} sessões</div>
              <div className="mono num" style={{ fontSize: 12, color: "var(--text-2)" }}>{fmtNumber(totalHoras, 1)} h</div>
              <div className="mono num" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmtEuro(totalValor)}</div>
            </div>
          </div>
        </Card>

        <Card title="Sessões recentes" action={<Badge tone="soft">Últimos 7 dias</Badge>}>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            <Table
              columns={[
                { label: "Data", mono: true, render: (r) => <span style={{ color: "var(--text-2)" }}>{r.data}</span> },
                { label: "Período", mono: true, render: (r) => `${r.inicio}–${r.fim}` },
                { label: "Duração", align: "right", mono: true, render: (r) => r.duracao },
                { label: "Valor", align: "right", mono: true, render: (r) => <span style={{ fontWeight: 600 }}>{fmtEuro(r.valor)}</span> },
              ]}
              rows={sessoes}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MONITORIZAÇÃO
// ════════════════════════════════════════════════════════════
function ScreenMonitorizacao({ tick, paused, onTogglePause }) {
  return (
    <div>
      <SectionHeader kicker="Tempo real" title="Monitorização">
        Detecção automática de abertura e fecho de ficheiros através do <span className="mono" style={{ color: "var(--text)" }}>tauri-plugin-fs</span>. Os contadores correm em segundo plano e não interferem com o trabalho do utilizador.
      </SectionHeader>

      {/* Status banner */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12, padding: 16,
        boxShadow: "var(--shadow-1)",
        marginBottom: 16,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: paused ? "oklch(0.97 0.04 80)" : "var(--live-soft)",
          color: paused ? "oklch(0.5 0.12 60)" : "oklch(0.42 0.12 155)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid " + (paused ? "oklch(0.88 0.07 80)" : "oklch(0.85 0.07 155)"),
        }}>
          {paused ? <IconPause size={18}/> : (
            <div style={{ position: "relative" }}>
              <span className="live-dot" style={{ width: 10, height: 10 }}/>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {paused ? "Monitorização pausada" : "A monitorizar — tudo em ordem"}
            </div>
            {!paused && <Badge tone="live"><span className="live-dot"/>FSEvents activo</Badge>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8 }}>
            <IconFolder size={13}/>
            <span className="mono">{ROOT_FOLDER}</span>
            <span style={{ color: "var(--text-3)" }}>·</span>
            <span>limiar de inactividade <span className="mono">5 min</span></span>
            <span style={{ color: "var(--text-3)" }}>·</span>
            <span>{MONITOR_FILES.filter(f => f.estado === "aberto").length} sessões abertas</span>
          </div>
        </div>
        <Button variant={paused ? "primary" : "default"} icon={paused ? <IconPlay size={14}/> : <IconPause size={14}/>} onClick={onTogglePause}>
          {paused ? "Retomar" : "Pausar"}
        </Button>
      </div>

      <Card title={`Ficheiros (${MONITOR_FILES.length})`} action={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge tone="live"><span className="live-dot"/>{MONITOR_FILES.filter(f => f.estado === "aberto").length} abertos</Badge>
          <Badge tone="soft">{MONITOR_FILES.filter(f => f.estado === "fechado").length} fechados</Badge>
        </div>
      }>
        <Table
          columns={[
            { label: "Ficheiro", render: (r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {r.estado === "aberto" ? (
                  <span className="live-dot"/>
                ) : (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border-strong)" }}/>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>{r.ficheiro}</div>
                </div>
              </div>
            ) },
            { label: "Cliente", render: (r) => r.cliente },
            { label: "Tipo · regra", render: (r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone="accent">{r.tipo}</Badge>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{r.regra}</span>
              </div>
            ) },
            { label: "Sessão actual", align: "right", mono: true, render: (r) => {
              if (r.estado !== "aberto") return <span style={{ color: "var(--text-3)" }}>—</span>;
              const liveSec = r.sessaoActual + tick;
              return <span style={{ color: "oklch(0.42 0.12 155)", fontWeight: 600 }}>{fmtSecondsAsHHMMSS(liveSec)}</span>;
            }},
            { label: "Total dia", align: "right", mono: true, render: (r) => {
              const total = r.estado === "aberto" ? r.totalDia + tick : r.totalDia;
              return fmtSecondsAsHM(total);
            }},
            { label: "Estado", align: "right", render: (r) => <StatusPill estado={r.estado}/> },
          ]}
          rows={MONITOR_FILES}
        />
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REGRAS DE PREÇO
// ════════════════════════════════════════════════════════════
function ScreenRegras() {
  const [regras, setRegras] = React.useState(REGRAS);
  const [adding, setAdding] = React.useState(false);
  const [novaPalavra, setNovaPalavra] = React.useState("");
  const [novoTipo, setNovoTipo] = React.useState("hora");
  const [novoValor, setNovoValor] = React.useState("");
  const [padrao, setPadrao] = React.useState(REGRA_PADRAO);

  const move = (idx, dir) => {
    const next = [...regras];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setRegras(next);
  };
  const remove = (id) => setRegras(regras.filter(r => r.id !== id));
  const addNew = () => {
    if (!novaPalavra.trim() || !novoValor) return;
    setRegras([...regras, { id: "r" + (regras.length + 1), palavra: novaPalavra.trim(), tipo: novoTipo, valor: parseFloat(novoValor) }]);
    setNovaPalavra(""); setNovoValor(""); setNovoTipo("hora"); setAdding(false);
  };

  return (
    <div>
      <SectionHeader kicker="Faturação" title="Regras de preço" action={
        <Button variant="primary" icon={<IconPlus size={14}/>} onClick={() => setAdding(true)}>Nova regra</Button>
      }>
        Cada regra associa uma palavra-chave do nome do ficheiro a uma tarifa. As regras são avaliadas por ordem — arraste para reordenar a prioridade.
      </SectionHeader>

      <Card>
        <div style={{
          display: "grid",
          gridTemplateColumns: "32px 28px 1fr 160px 160px 80px",
          padding: "10px 18px",
          background: "var(--bg-alt)",
          borderBottom: "1px solid var(--border)",
          fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-3)",
          borderRadius: "12px 12px 0 0",
        }}>
          <div></div>
          <div>#</div>
          <div>Palavra-chave</div>
          <div>Tipo</div>
          <div style={{ textAlign: "right" }}>Valor</div>
          <div style={{ textAlign: "right" }}>Acções</div>
        </div>
        {regras.map((r, i) => (
          <div key={r.id} style={{
            display: "grid",
            gridTemplateColumns: "32px 28px 1fr 160px 160px 80px",
            padding: "12px 18px", alignItems: "center",
            borderBottom: i === regras.length - 1 ? "none" : "1px solid var(--border)",
            gap: 12,
          }}>
            <div style={{ color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab" }}>
              <IconDrag size={14}/>
            </div>
            <div className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>{i + 1}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone="accent" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "3px 10px" }}>{r.palavra}</Badge>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>contém em <span className="mono">nome.docx</span></span>
            </div>
            <div>
              <Badge tone="soft">{r.tipo === "hora" ? "Por hora" : "Valor fixo"}</Badge>
            </div>
            <div className="mono num" style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
              {fmtEuro(r.valor)}{r.tipo === "hora" && <span style={{ color: "var(--text-3)", fontWeight: 400 }}> /h</span>}
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={iconBtnStyle(i === 0)} title="Subir">
                <IconArrowUp size={13}/>
              </button>
              <button onClick={() => move(i, 1)} disabled={i === regras.length - 1} style={iconBtnStyle(i === regras.length - 1)} title="Descer">
                <IconArrowDown size={13}/>
              </button>
              <button onClick={() => remove(r.id)} style={iconBtnStyle(false)} title="Eliminar">
                <IconTrash size={13}/>
              </button>
            </div>
          </div>
        ))}
        {adding && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "32px 28px 1fr 160px 160px 80px",
            padding: "12px 18px", alignItems: "center", gap: 12,
            background: "var(--accent-soft)",
            borderTop: "1px solid var(--accent-line)",
          }}>
            <div></div>
            <div className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>{regras.length + 1}</div>
            <input autoFocus value={novaPalavra} onChange={e => setNovaPalavra(e.target.value)}
              placeholder="ex: minuta"
              style={{ height: 32, padding: "0 10px", border: "1px solid var(--border-strong)", borderRadius: 6, background: "var(--surface)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}/>
            <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)}
              style={{ height: 32, padding: "0 8px", border: "1px solid var(--border-strong)", borderRadius: 6, background: "var(--surface)", fontSize: 12.5 }}>
              <option value="hora">Por hora</option>
              <option value="fixo">Valor fixo</option>
            </select>
            <input type="number" value={novoValor} onChange={e => setNovoValor(e.target.value)}
              placeholder="0,00"
              style={{ height: 32, padding: "0 10px", border: "1px solid var(--border-strong)", borderRadius: 6, background: "var(--surface)", fontFamily: "var(--font-mono)", fontSize: 12.5, textAlign: "right" }}/>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
              <button onClick={addNew} style={{ ...iconBtnStyle(false), background: "var(--accent)", color: "white", border: "none" }} title="Adicionar">
                <IconCheck size={13} stroke={2}/>
              </button>
              <button onClick={() => { setAdding(false); setNovaPalavra(""); setNovoValor(""); }} style={iconBtnStyle(false)} title="Cancelar">
                ✕
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card title="Tarifa padrão" style={{ marginTop: 14 }} action={<Badge tone="soft">Aplicada quando nenhuma regra corresponde</Badge>}>
        <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>
              Garante que nenhum ficheiro fica sem valorização. Aplica-se quando o nome do ficheiro não contém nenhuma das palavras-chave acima.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <Select label="Tipo" value={padrao.tipo} onChange={(v) => setPadrao({ ...padrao, tipo: v })} options={[
              { value: "hora", label: "Por hora" }, { value: "fixo", label: "Valor fixo" }
            ]} width={140}/>
            <TextField label="Valor" value={padrao.valor.toFixed(2).replace(".", ",")} mono suffix={padrao.tipo === "hora" ? "€/h" : "€"} width={140}/>
          </div>
        </div>
      </Card>
    </div>
  );
}

const iconBtnStyle = (disabled) => ({
  width: 28, height: 28, borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: disabled ? "var(--text-3)" : "var(--text-2)",
  cursor: disabled ? "not-allowed" : "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  opacity: disabled ? 0.5 : 1,
  fontSize: 12,
});

// ════════════════════════════════════════════════════════════
// COBRANÇAS
// ════════════════════════════════════════════════════════════
function ScreenCobrancas({ onConfirm }) {
  const [aba, setAba] = React.useState("ficheiro"); // ficheiro | cliente
  const [selected, setSelected] = React.useState(new Set()); // set of pendência ids
  const [expanded, setExpanded] = React.useState(new Set()); // cliente ids expanded (aba cliente)
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // Agrupar pendentes por cliente
  const byCliente = React.useMemo(() => {
    const map = new Map();
    for (const p of COBRANCAS_PENDENTES) {
      if (!map.has(p.clienteId)) map.set(p.clienteId, []);
      map.get(p.clienteId).push(p);
    }
    return map;
  }, []);

  const clientesPendentes = Array.from(byCliente.entries()).map(([id, items]) => {
    const cliente = CLIENTES.find(c => c.id === id);
    return {
      id, nome: cliente?.nome || id,
      ficheiros: items.length,
      horas: items.reduce((a, p) => a + p.horas, 0),
      valor: items.reduce((a, p) => a + p.valor, 0),
      items,
    };
  }).sort((a, b) => b.valor - a.valor);

  const allIds = COBRANCAS_PENDENTES.map(p => p.id);
  const allSelected = selected.size === allIds.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };
  const toggleClienteGroup = (clienteId) => {
    const items = byCliente.get(clienteId);
    const itemIds = items.map(p => p.id);
    const allOn = itemIds.every(id => selected.has(id));
    const next = new Set(selected);
    if (allOn) itemIds.forEach(id => next.delete(id));
    else itemIds.forEach(id => next.add(id));
    setSelected(next);
  };
  const clienteState = (clienteId) => {
    const itemIds = byCliente.get(clienteId).map(p => p.id);
    const on = itemIds.filter(id => selected.has(id)).length;
    if (on === 0) return "none";
    if (on === itemIds.length) return "all";
    return "some";
  };
  const toggleExpand = (cid) => {
    const next = new Set(expanded);
    if (next.has(cid)) next.delete(cid); else next.add(cid);
    setExpanded(next);
  };

  // Resumo da cobrança
  const selectedItems = COBRANCAS_PENDENTES.filter(p => selected.has(p.id));
  const resumoPorCliente = (() => {
    const m = new Map();
    for (const p of selectedItems) {
      const c = CLIENTES.find(c => c.id === p.clienteId);
      if (!m.has(p.clienteId)) m.set(p.clienteId, { nome: c?.nome || p.clienteId, ficheiros: 0, valor: 0 });
      const e = m.get(p.clienteId);
      e.ficheiros += 1;
      e.valor += p.valor;
    }
    return Array.from(m.values()).sort((a, b) => b.valor - a.valor);
  })();
  const resumoTotal = selectedItems.reduce((a, p) => a + p.valor, 0);

  return (
    <div>
      <SectionHeader kicker="Faturação" title="Cobranças">
        Selecione os ficheiros ou clientes a marcar como cobrados. Ao confirmar, o valor é removido do contador <em>Total por cobrar</em> e fica registado no histórico.
      </SectionHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14, alignItems: "flex-start" }}>
        {/* Coluna esquerda: lista */}
        <Card padding={0}>
          <div style={{ padding: "10px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Tabs value={aba} onChange={setAba} options={[
              { value: "ficheiro", label: "Por ficheiro", count: COBRANCAS_PENDENTES.length },
              { value: "cliente",  label: "Por cliente",  count: clientesPendentes.length },
            ]}/>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10 }}>
              <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll}/>
              <button onClick={toggleAll} style={{ background: "transparent", border: "none", padding: 0, fontSize: 12, color: "var(--text-2)" }}>
                {allSelected ? "Limpar selecção" : "Selecionar tudo"}
              </button>
            </div>
          </div>

          {/* Aba: Por ficheiro — agrupados por cliente */}
          {aba === "ficheiro" && (
            <div>
              {clientesPendentes.map((cli, ci) => {
                const state = clienteState(cli.id);
                return (
                  <div key={cli.id} style={{ borderTop: "1px solid var(--border)" }}>
                    {/* group header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 18px",
                      background: "var(--bg-alt)",
                    }}>
                      <Checkbox
                        checked={state === "all"}
                        indeterminate={state === "some"}
                        onChange={() => toggleClienteGroup(cli.id)}
                      />
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{cli.nome}</div>
                        <Badge tone="soft">{cli.ficheiros} ficheiros</Badge>
                      </div>
                      <div className="mono num" style={{ fontSize: 12, color: "var(--text-2)" }}>{fmtNumber(cli.horas, 1)} h</div>
                      <div className="mono num" style={{ fontSize: 13, fontWeight: 700, color: "oklch(0.45 0.1 60)", minWidth: 90, textAlign: "right" }}>{fmtEuro(cli.valor)}</div>
                    </div>
                    {/* items */}
                    {cli.items.map(p => (
                      <div key={p.id}
                        onClick={() => toggleOne(p.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 18px 10px 36px",
                          borderTop: "1px solid var(--border)",
                          cursor: "pointer",
                          background: selected.has(p.id) ? "var(--accent-soft)" : "transparent",
                        }}>
                        <Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mono" style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.ficheiro}</div>
                          <div style={{ marginTop: 2 }}>
                            <Badge tone={p.tipo === "—" ? "soft" : "accent"}>{p.tipo}</Badge>
                          </div>
                        </div>
                        <div className="mono num" style={{ fontSize: 12, color: "var(--text-3)", minWidth: 70, textAlign: "right" }}>{fmtNumber(p.horas, 1)} h</div>
                        <div className="mono num" style={{ fontSize: 13, fontWeight: 600, minWidth: 90, textAlign: "right" }}>{fmtEuro(p.valor)}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Aba: Por cliente — colapsáveis */}
          {aba === "cliente" && (
            <div>
              {clientesPendentes.map(cli => {
                const state = clienteState(cli.id);
                const isOpen = expanded.has(cli.id);
                return (
                  <div key={cli.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 18px",
                      cursor: "pointer",
                      background: state === "all" ? "var(--accent-soft)" : state === "some" ? "oklch(0.97 0.02 250)" : "transparent",
                    }}
                      onClick={() => toggleClienteGroup(cli.id)}
                    >
                      <Checkbox
                        checked={state === "all"}
                        indeterminate={state === "some"}
                        onChange={() => toggleClienteGroup(cli.id)}
                      />
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(cli.id); }} style={{
                        width: 22, height: 22, border: "none", background: "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease",
                      }}>
                        <IconChevron size={12}/>
                      </button>
                      <div style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: "var(--accent-soft)", color: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 600, fontSize: 11, border: "1px solid var(--accent-line)",
                      }}>{cli.nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{cli.nome}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{cli.ficheiros} ficheiros · {fmtNumber(cli.horas, 1)} h</div>
                      </div>
                      <div className="mono num" style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.45 0.1 60)", minWidth: 100, textAlign: "right" }}>{fmtEuro(cli.valor)}</div>
                    </div>
                    {isOpen && (
                      <div style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}>
                        {cli.items.map(p => (
                          <div key={p.id} onClick={() => toggleOne(p.id)} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "8px 18px 8px 68px",
                            borderBottom: "1px solid var(--border)",
                            cursor: "pointer",
                          }}>
                            <Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} size={14}/>
                            <div className="mono" style={{ flex: 1, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.ficheiro}</div>
                            <div className="mono num" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{fmtNumber(p.horas, 1)} h</div>
                            <div className="mono num" style={{ fontSize: 12, fontWeight: 600, minWidth: 80, textAlign: "right" }}>{fmtEuro(p.valor)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Coluna direita: resumo */}
        <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Resumo da cobrança">
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--text-3)" }}>Selecionados</div>
                <div className="mono num" style={{ fontSize: 12, color: "var(--text-2)" }}>{selectedItems.length} ficheiros</div>
              </div>
              <div className="num" style={{
                fontFamily: "var(--font-display)", fontWeight: 500,
                fontSize: 38, letterSpacing: -1, lineHeight: 1,
                color: selectedItems.length > 0 ? "var(--text)" : "var(--text-3)",
              }}>
                {fmtEuro(resumoTotal)}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 0", maxHeight: 280, overflowY: "auto" }}>
              {resumoPorCliente.length === 0 ? (
                <div style={{ padding: "12px 18px", fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
                  Nenhum ficheiro selecionado.<br/>
                  Escolha à esquerda os itens a cobrar.
                </div>
              ) : resumoPorCliente.map((r, i) => (
                <div key={i} style={{ padding: "8px 18px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nome}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{r.ficheiros} ficheiros</div>
                  </div>
                  <div className="mono num" style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtEuro(r.valor)}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: 14, borderTop: "1px solid var(--border)",
              background: "var(--bg-alt)", borderRadius: "0 0 12px 12px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <Button variant="primary" icon={<IconBilling size={14}/>}
                disabled={selectedItems.length === 0}
                onClick={() => setConfirmOpen(true)}
                style={{ width: "100%", justifyContent: "center", height: 38 }}>
                Marcar como cobrado
              </Button>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.4 }}>
                Após confirmação, o valor sai do <em>Total por cobrar</em> e fica no histórico.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Diálogo de confirmação */}
      {confirmOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 18, 30, 0.42)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
          backdropFilter: "blur(2px)",
        }}>
          <div style={{
            width: 460, background: "var(--surface)",
            borderRadius: 14, boxShadow: "0 24px 80px rgba(0,0,0,0.32), 0 8px 20px rgba(0,0,0,0.12)",
            overflow: "hidden", border: "1px solid var(--border)",
          }}>
            <div style={{ padding: "20px 24px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Confirmar cobrança</div>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22, letterSpacing: -0.3 }}>
                Marcar {selectedItems.length} ficheiro{selectedItems.length === 1 ? "" : "s"} como cobrado?
              </h3>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.5 }}>
                Será registado um valor de <strong className="mono num">{fmtEuro(resumoTotal)}</strong> em {resumoPorCliente.length} cliente{resumoPorCliente.length === 1 ? "" : "s"}. Esta operação é <strong>irreversível pela aplicação</strong> (pode ser corrigida na base de dados).
              </div>
            </div>
            <div style={{
              padding: "14px 24px", background: "var(--bg-alt)",
              borderTop: "1px solid var(--border)",
              display: "flex", justifyContent: "flex-end", gap: 8,
            }}>
              <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="primary" icon={<IconCheck size={14} stroke={2}/>} onClick={() => { setConfirmOpen(false); setSelected(new Set()); onConfirm && onConfirm(); }}>
                Confirmar cobrança
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ANÁLISE
// ════════════════════════════════════════════════════════════
function ScreenAnalise() {
  const [periodo, setPeriodo] = React.useState("3mes");

  const tiposPossiveis = ["Contrato", "Parecer", "Petição", "Recurso", "Procuração", "Contestação"];
  const dadosCliente = CLIENTES.map((c, i) => ({
    ...c,
    tipoFreq: tiposPossiveis[i % tiposPossiveis.length],
  }));
  const total = dadosCliente.reduce((a, c) => ({
    horas: a.horas + c.horas,
    cobrado: a.cobrado + c.valorCobrado,
    porCobrar: a.porCobrar + c.valorPorCobrar,
    ficheiros: a.ficheiros + c.ficheiros,
  }), { horas: 0, cobrado: 0, porCobrar: 0, ficheiros: 0 });

  return (
    <div>
      <SectionHeader kicker="Faturação" title="Análise" action={
        <Segmented value={periodo} onChange={setPeriodo} options={[
          { value: "semana", label: "Esta semana" },
          { value: "mes", label: "Este mês" },
          { value: "3mes", label: "Últimos 3 meses" },
          { value: "custom", label: "Personalizado" },
        ]}/>
      }>
        Toda a análise é feita dentro da aplicação — nenhum dado é enviado para servidores externos.
      </SectionHeader>

      <Card title="Valor faturado por semana" style={{ marginBottom: 14 }} action={
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "oklch(0.78 0.04 250)", border: "1px solid oklch(0.7 0.05 250)" }}/>
            <span style={{ fontSize: 11, color: "var(--text-2)" }}>Semanas anteriores</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }}/>
            <span style={{ fontSize: 11, color: "var(--text-2)" }}>Semana actual</span>
          </div>
        </div>
      }>
        <BarChart data={SEMANAS} height={240}/>
      </Card>

      <Card title="Análise por cliente" style={{ marginBottom: 14 }}>
        <Table
          columns={[
            { label: "Cliente", render: (r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: "var(--accent-soft)", color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 600, fontSize: 10.5,
                  border: "1px solid var(--accent-line)",
                }}>{r.nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}</div>
                <span style={{ fontWeight: 500 }}>{r.nome}</span>
              </div>
            ) },
            { label: "Horas", align: "right", mono: true, render: (r) => fmtNumber(r.horas, 1) + " h" },
            { label: "Tipo mais frequente", render: (r) => <Badge tone="accent">{r.tipoFreq}</Badge> },
            { label: "Cobrado", align: "right", mono: true, render: (r) => <span style={{ color: "var(--text-2)" }}>{fmtEuro(r.valorCobrado)}</span> },
            { label: "Por cobrar", align: "right", mono: true, render: (r) => (
              r.valorPorCobrar > 0
                ? <span style={{ fontWeight: 700, color: "oklch(0.45 0.1 60)" }}>{fmtEuro(r.valorPorCobrar)}</span>
                : <span style={{ color: "var(--text-3)" }}>—</span>
            ) },
          ]}
          rows={dadosCliente}
        />
        <div style={{
          padding: "14px 16px", borderTop: "2px solid var(--border-strong)",
          background: "var(--bg-alt)", borderRadius: "0 0 12px 12px",
          display: "grid", gridTemplateColumns: "1fr 110px 1fr 130px 130px", gap: 16, alignItems: "center",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", letterSpacing: 0.3, textTransform: "uppercase" }}>Total geral</div>
          <div className="mono num" style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{fmtNumber(total.horas, 1)} h</div>
          <div></div>
          <div className="mono num" style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>{fmtEuro(total.cobrado)}</div>
          <div className="mono num" style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: "oklch(0.45 0.1 60)" }}>{fmtEuro(total.porCobrar)}</div>
        </div>
      </Card>

      <Card title="Histórico de cobranças" action={<Badge tone="soft">{HISTORICO_COBRANCAS.length} cobranças</Badge>}>
        <Table
          columns={[
            { label: "Data", mono: true, render: (r) => (
              <div>
                <div style={{ fontWeight: 500, color: "var(--text)" }}>{r.data}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{r.hora}</div>
              </div>
            ) },
            { label: "Clientes incluídos", render: (r) => (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {r.clientes.map((c, i) => <Badge key={i} tone="soft">{c}</Badge>)}
              </div>
            ) },
            { label: "Ficheiros", align: "right", mono: true, render: (r) => r.ficheiros },
            { label: "Valor cobrado", align: "right", mono: true, render: (r) => <span style={{ fontWeight: 600 }}>{fmtEuro(r.valor)}</span> },
          ]}
          rows={HISTORICO_COBRANCAS}
        />
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DEFINIÇÕES
// ════════════════════════════════════════════════════════════
function ScreenDefinicoes() {
  const [pasta, setPasta] = React.useState(ROOT_FOLDER);
  const [limiar, setLimiar] = React.useState(5);
  const [moeda, setMoeda] = React.useState("EUR");
  const [idioma, setIdioma] = React.useState("pt");
  const Row = ({ title, sub, children }) => (
    <div style={{
      padding: "18px 22px", display: "grid",
      gridTemplateColumns: "1fr 1.2fr", gap: 32, alignItems: "flex-start",
      borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{sub}</div>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <div>
      <SectionHeader kicker="Sistema" title="Definições">
        Configuração geral da aplicação. Todas as preferências ficam guardadas localmente.
      </SectionHeader>

      <Card title="Geral">
        <Row title="Pasta raiz dos clientes" sub="Pasta principal que contém as subpastas dos clientes. Cada subpasta de primeiro nível é interpretada como um cliente. Ao alterar, a monitorização reinicia automaticamente.">
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              flex: 1, height: 34, padding: "0 12px",
              border: "1px solid var(--border-strong)", borderRadius: 8,
              background: "var(--surface-2)",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-mono)", fontSize: 12,
            }}>
              <IconFolder size={13} style={{ color: "var(--text-3)" }}/>
              {pasta}
            </div>
            <Button>Escolher pasta…</Button>
          </div>
        </Row>
        <Row title="Limiar de inactividade" sub="Duração máxima de inactividade antes de o contador de tempo ser pausado automaticamente para um ficheiro aberto.">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TextField value={String(limiar)} onChange={(v) => setLimiar(Number(v) || 0)} mono suffix="min" width={120}/>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>recomendado: 5 minutos</span>
          </div>
        </Row>
        <Row title="Moeda" sub="Moeda utilizada em todos os cálculos e apresentações de valor na aplicação.">
          <Select value={moeda} onChange={setMoeda} options={[
            { value: "EUR", label: "Euro (€)" },
            { value: "USD", label: "Dólar ($)" },
            { value: "GBP", label: "Libra (£)" },
            { value: "BRL", label: "Real (R$)" },
          ]} width={200}/>
        </Row>
        <Row title="Idioma da interface" sub="Idioma utilizado em toda a aplicação.">
          <Segmented value={idioma} onChange={setIdioma} options={[
            { value: "pt", label: "Português" }, { value: "en", label: "English" }
          ]}/>
        </Row>
      </Card>

      <Card title="Base de dados" style={{ marginTop: 14 }} action={<Badge tone="soft"><IconDb size={11}/> SQLite · local</Badge>}>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Localização do ficheiro</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>
              Toda a informação da aplicação é guardada num único ficheiro SQLite. Para fazer backup, basta copiar este ficheiro para outro local.
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              border: "1px solid var(--border-strong)", borderRadius: 8,
              background: "var(--surface-2)",
              fontFamily: "var(--font-mono)", fontSize: 12,
            }}>
              <IconDb size={14} style={{ color: "var(--accent)" }}/>
              <span style={{ flex: 1, color: "var(--text-2)" }}>{DB_INFO.caminho}</span>
              <span className="mono num" style={{ color: "var(--text-3)" }}>{DB_INFO.tamanho}</span>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
            padding: "14px 16px",
            border: "1px solid var(--border)",
            background: "var(--bg-alt)",
            borderRadius: 8,
          }}>
            {[
              ["Sessões registadas", DB_INFO.registos.sessoes],
              ["Ficheiros vigiados", DB_INFO.registos.ficheiros],
              ["Clientes", DB_INFO.registos.clientes],
              ["Cobranças efectuadas", DB_INFO.registos.cobrancas],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 2 }}>{k}</div>
                <div className="mono num" style={{ fontSize: 18, fontWeight: 600 }}>{v.toLocaleString("pt-PT")}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              Último backup manual: <span className="mono">{DB_INFO.ultimoBackup}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button icon={<IconExternal size={13}/>}>Abrir pasta de dados</Button>
              <Button variant="primary" icon={<IconDownload size={13}/>}>Backup da base de dados</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, {
  ScreenDashboard, ScreenClientes, ScreenClienteDetalhe,
  ScreenMonitorizacao, ScreenRegras, ScreenCobrancas, ScreenAnalise, ScreenDefinicoes,
});
