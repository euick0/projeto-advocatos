// UI primitives — buttons, badges, cards, tables, chart, window chrome

// ────────────────────── helpers ──────────────────────
const fmtEuro = (n, decimals = 2) =>
Number(n).toLocaleString("pt-PT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + " €";
const fmtNumber = (n, decimals = 1) =>
Number(n).toLocaleString("pt-PT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtSecondsAsHHMMSS = (s) => {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor(s % 3600 / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
};
const fmtSecondsAsHM = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};

// ────────────────────── window chrome ──────────────────────
function TrafficLights() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) =>
      <div key={i} style={{
        width: 12, height: 12, borderRadius: "50%", background: c,
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)"
      }} />
      )}
    </div>);

}

// ────────────────────── badges ──────────────────────
function Badge({ children, tone = "neutral", style = {} }) {
  const tones = {
    neutral: { bg: "oklch(0.96 0.005 100)", fg: "var(--text-2)", border: "var(--border)" },
    accent: { bg: "var(--accent-soft)", fg: "var(--accent)", border: "var(--accent-line)" },
    live: { bg: "var(--live-soft)", fg: "oklch(0.42 0.12 155)", border: "oklch(0.85 0.07 155)" },
    warn: { bg: "oklch(0.97 0.04 80)", fg: "oklch(0.45 0.1 60)", border: "oklch(0.88 0.07 80)" },
    soft: { bg: "var(--bg-alt)", fg: "var(--text-2)", border: "var(--border)" }
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px", borderRadius: 999,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.05,
      background: tones.bg, color: tones.fg,
      border: `1px solid ${tones.border}`,
      ...style
    }}>{children}</span>);

}

function StatusPill({ estado }) {
  if (estado === "aberto") {
    return (
      <Badge tone="live">
        <span className="live-dot" />
        Aberto
      </Badge>);

  }
  return <Badge tone="soft">Fechado</Badge>;
}

// Estado de cobrança: "por-cobrar" | "cobrado" | "parcial"
function CobrancaPill({ estado, compact }) {
  if (estado === "cobrado") {
    return (
      <Badge tone="soft" style={compact ? { padding: "2px 6px" } : {}}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.8L3.6 6.8 7.6 2.4" /></svg>
        Cobrado
      </Badge>);

  }
  if (estado === "parcial") {
    return (
      <Badge tone="warn" style={compact ? { padding: "2px 6px" } : {}}>
        Parcial
      </Badge>);

  }
  return (
    <Badge tone="warn" style={compact ? { padding: "2px 6px" } : {}}>
      Por cobrar
    </Badge>);

}

// Checkbox
function Checkbox({ checked, onChange, indeterminate, label, size = 16 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  const box =
  <span style={{
    width: size, height: size, borderRadius: 4,
    border: `1.4px solid ${checked || indeterminate ? "var(--accent)" : "var(--border-strong)"}`,
    background: checked || indeterminate ? "var(--accent)" : "var(--surface)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "white", flexShrink: 0,
    transition: "all 0.12s ease",
    boxShadow: checked || indeterminate ? "0 0 0 3px oklch(0.42 0.08 250 / 0.12)" : "none"
  }}>
      {checked &&
    <svg width={size - 5} height={size - 5} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.8 5.2L4.2 7.4 8.4 2.8" />
        </svg>
    }
      {indeterminate && !checked &&
    <span style={{ width: size - 6, height: 2, background: "white", borderRadius: 1 }} />
    }
    </span>;

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <input ref={ref} type="checkbox" checked={!!checked} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
      {box}
      {label && <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>}
    </label>);

}

// Tabs — para "Por ficheiro" / "Por cliente"
function Tabs({ value, onChange, options }) {
  return (
    <div style={{
      display: "flex", gap: 24, borderBottom: "1px solid var(--border)",
      paddingLeft: 4
    }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            background: "transparent", border: "none",
            padding: "10px 2px",
            fontSize: 13, fontWeight: active ? 600 : 500,
            color: active ? "var(--text)" : "var(--text-2)",
            borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
            marginBottom: -1,
            display: "inline-flex", alignItems: "center", gap: 8,
            cursor: "pointer"
          }}>
            {o.label}
            {o.count != null &&
            <span style={{
              fontSize: 10.5, padding: "1px 7px", borderRadius: 999,
              background: active ? "var(--accent-soft)" : "var(--bg-alt)",
              color: active ? "var(--accent)" : "var(--text-3)",
              fontWeight: 600,
              border: `1px solid ${active ? "var(--accent-line)" : "var(--border)"}`
            }}>{o.count}</span>
            }
          </button>);

      })}
    </div>);

}

// ────────────────────── buttons ──────────────────────
function Button({ children, variant = "default", size = "md", onClick, style = {}, icon, disabled, type = "button" }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontSize: size === "sm" ? 12 : 13, fontWeight: 500,
    height: size === "sm" ? 28 : 34,
    padding: size === "sm" ? "0 10px" : "0 13px",
    borderRadius: 8,
    border: "1px solid transparent",
    transition: "all 0.12s ease",
    whiteSpace: "nowrap"
  };
  const variants = {
    default: { background: "var(--surface)", color: "var(--text)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-1)" },
    primary: { background: "var(--accent)", color: "white", borderColor: "var(--accent)", boxShadow: "var(--shadow-1)" },
    ghost: { background: "transparent", color: "var(--text-2)", borderColor: "transparent" },
    danger: { background: "var(--surface)", color: "oklch(0.5 0.18 25)", borderColor: "oklch(0.85 0.05 25)" }
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}), ...style }}>
      {icon}{children}
    </button>);

}

// ────────────────────── card / panel ──────────────────────
function Card({ title, action, children, style = {}, padding = 18, headerStyle = {} }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      boxShadow: "var(--shadow-1)",
      ...style
    }}>
      {title &&
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid var(--border)",
        ...headerStyle
      }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: 0.1 }}>{title}</div>
          {action}
        </div>
      }
      <div style={{ padding: title ? 0 : padding }}>{children}</div>
    </div>);

}

// ────────────────────── metric tile ──────────────────────
function Metric({ label, value, unit, sub, accent = false, mini }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: accent ? "var(--accent)" : "var(--surface)",
      color: accent ? "white" : "var(--text)",
      border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
      borderRadius: 12,
      padding: "16px 18px",
      boxShadow: "var(--shadow-1)",
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative"
    }}>
      <div style={{
        fontSize: 11, fontWeight: 500, letterSpacing: 0.4,
        textTransform: "uppercase",
        color: accent ? "rgba(255,255,255,0.7)" : "var(--text-3)"
      }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div className="num" style={{
          fontFamily: "var(--font-display)", fontWeight: 500,
          fontSize: 32, letterSpacing: -0.8, lineHeight: 1
        }}>{value}</div>
        {unit && <div style={{ fontSize: 14, fontWeight: 500, color: accent ? "rgba(255,255,255,0.75)" : "var(--text-3)" }}>{unit}</div>}
      </div>
      {sub &&
      <div style={{
        fontSize: 11, color: accent ? "rgba(255,255,255,0.7)" : "var(--text-3)",
        display: "flex", alignItems: "center", gap: 5
      }}>{sub}</div>
      }
      {mini &&
      <div style={{ position: "absolute", right: 16, top: 16, opacity: accent ? 0.7 : 0.5 }}>{mini}</div>
      }
    </div>);

}

// ────────────────────── tables ──────────────────────
function Table({ columns, rows, onRowClick, denseHeader = false }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c, i) =>
            <th key={i} style={{
              textAlign: c.align || "left",
              padding: denseHeader ? "8px 16px" : "10px 16px",
              fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase",
              color: "var(--text-3)", borderBottom: "1px solid var(--border)",
              background: "var(--bg-alt)",
              width: c.width,
              whiteSpace: "nowrap"
            }}>{c.label}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) =>
          <tr key={ri}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          style={{
            cursor: onRowClick ? "pointer" : "default",
            borderBottom: ri === rows.length - 1 ? "none" : "1px solid var(--border)",
            transition: "background 0.1s ease"
          }}
          onMouseEnter={onRowClick ? (e) => e.currentTarget.style.background = "var(--bg-alt)" : undefined}
          onMouseLeave={onRowClick ? (e) => e.currentTarget.style.background = "transparent" : undefined}>
            
              {columns.map((c, i) =>
            <td key={i} style={{
              textAlign: c.align || "left",
              padding: "12px 16px",
              color: "var(--text)",
              whiteSpace: c.wrap ? "normal" : "nowrap",
              fontFamily: c.mono ? "var(--font-mono)" : "inherit",
              fontVariantNumeric: c.mono ? "tabular-nums" : "normal",
              fontSize: c.mono ? 12.5 : 13
            }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}

// ────────────────────── inputs ──────────────────────
function TextField({ label, value, onChange, placeholder, prefix, suffix, mono, type = "text", style = {}, width }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</div>}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8, padding: "0 10px",
        height: 34, ...style
      }}>
        {prefix && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{prefix}</span>}
        <input
          type={type} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          style={{
            border: "none", background: "transparent", flex: 1, fontSize: 13,
            color: "var(--text)", height: "100%",
            fontFamily: mono ? "var(--font-mono)" : "inherit",
            fontVariantNumeric: mono ? "tabular-nums" : "normal"
          }} />
        
        {suffix && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{suffix}</span>}
      </div>
    </div>);

}

function Select({ value, onChange, options, label, width }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{
          appearance: "none", WebkitAppearance: "none",
          width: "100%", height: 34,
          padding: "0 32px 0 12px",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 8, fontSize: 13, color: "var(--text)"
        }}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-3)" }}>
          <IconChevronDown size={14} stroke={1.8} />
        </div>
      </div>
    </div>);

}

// segmented control for period selector
function Segmented({ value, onChange, options }) {
  return (
    <div style={{
      display: "inline-flex", padding: 3,
      background: "var(--bg-alt)",
      border: "1px solid var(--border)",
      borderRadius: 9,
      gap: 2
    }} data-comment-anchor="33d69a4505-div-361-5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            padding: "5px 12px", borderRadius: 7, border: "none",
            background: active ? "var(--surface)" : "transparent",
            color: active ? "var(--text)" : "var(--text-2)",
            fontSize: 12, fontWeight: active ? 600 : 500,
            boxShadow: active ? "var(--shadow-1)" : "none"
          }}>
            {o.label}
          </button>);

      })}
    </div>);

}

// Toggle
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 38, height: 22, borderRadius: 999,
      background: value ? "var(--accent)" : "var(--border-strong)",
      border: "none", padding: 2, position: "relative",
      transition: "background 0.15s ease"
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "white",
        transform: `translateX(${value ? 16 : 0}px)`,
        transition: "transform 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)"
      }} />
    </button>);

}

// ────────────────────── chart ──────────────────────
function BarChart({ data, height = 220, valueKey = "valor", labelKey = "label" }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  const niceMax = Math.ceil(max / 1000) * 1000;
  const yTicks = [0, niceMax / 4, niceMax / 2, niceMax * 3 / 4, niceMax];
  const chartH = height - 40;
  return (
    <div style={{ display: "flex", padding: "8px 18px 18px" }}>
      {/* Y-axis */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 56, height: chartH, paddingRight: 10, fontSize: 10, color: "var(--text-3)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
        {[...yTicks].reverse().map((t, i) =>
        <div key={i} style={{ lineHeight: 1 }}>{(t / 1000).toFixed(1)}k €</div>
        )}
      </div>
      {/* Chart area */}
      <div style={{ flex: 1, position: "relative", height: chartH, borderLeft: "1px solid var(--border)" }}>
        {/* gridlines */}
        {yTicks.map((t, i) =>
        <div key={i} style={{
          position: "absolute", left: 0, right: 0,
          bottom: t / niceMax * chartH,
          borderTop: "1px dashed oklch(0.93 0.005 100)"
        }} />
        )}
        {/* bars */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 10, padding: "0 14px" }}>
          {data.map((d, i) => {
            const h = d[valueKey] / niceMax * chartH;
            const isLast = i === data.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                <div style={{ flex: 1 }} />
                <div style={{
                  width: "100%", maxWidth: 36,
                  height: h, borderRadius: "4px 4px 0 0",
                  background: isLast ? "var(--accent)" : "oklch(0.78 0.04 250)",
                  border: `1px solid ${isLast ? "var(--accent)" : "oklch(0.7 0.05 250)"}`,
                  position: "relative"
                }}>
                  <div className="mono num" style={{
                    position: "absolute", left: "50%", top: -18, transform: "translateX(-50%)",
                    fontSize: 10, color: isLast ? "var(--accent)" : "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap"
                  }}>
                    {(d[valueKey] / 1000).toFixed(1)}k
                  </div>
                </div>
              </div>);

          })}
        </div>
        {/* x-labels */}
        <div style={{ position: "absolute", left: 0, right: 0, top: chartH + 8, display: "flex", gap: 10, padding: "0 14px" }}>
          {data.map((d, i) =>
          <div key={i} style={{
            flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-3)",
            fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums"
          }}>{d[labelKey]}</div>
          )}
        </div>
      </div>
    </div>);

}

// section header with small caps subtitle
function SectionHeader({ kicker, title, action, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
      <div>
        {kicker && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>{kicker}</div>}
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 26, letterSpacing: -0.4, color: "var(--text)" }}>{title}</h1>
        {children && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, maxWidth: 600 }}>{children}</div>}
      </div>
      {action}
    </div>);

}

Object.assign(window, {
  fmtEuro, fmtNumber, fmtSecondsAsHHMMSS, fmtSecondsAsHM,
  TrafficLights, Badge, StatusPill, CobrancaPill, Checkbox, Tabs,
  Button, Card, Metric, Table,
  TextField, Select, Segmented, Toggle, BarChart, SectionHeader
});