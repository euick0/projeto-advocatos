# LexTimer

Desktop app for Portuguese lawyers — auto-tracks file-open time, computes billable value. Tauri v2 + Svelte + SQLite.

## Run frontend prototype (browser, no Rust needed)

```
npm install
npm run dev
```

Open http://localhost:1420 — full Svelte port of the design, with mock data.

## Run desktop app (requires Rust)

1. Install Rust via rustup: https://rustup.rs
2. On Windows: install **Microsoft C++ Build Tools** (Desktop development with C++ workload).
3. On macOS: `xcode-select --install`.
4. Install Tauri CLI: `npm install -g @tauri-apps/cli` (or use `npx tauri`).
5. Add icons under `src-tauri/icons/` (32x32.png, 128x128.png, icon.icns, icon.ico).
6. Run:
   ```
   npm run tauri dev
   ```

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Vite entry, mounts Svelte root |
| `src/App.svelte` | Window shell — sidebar + topbar + screen router |
| `src/screens/` | 7 screens (Dashboard, Clientes, ClienteDetalhe, Monitorização, Regras, Análise, Definições) |
| `src/components/` | UI primitives (Button, Card, Metric, Table, BarChart, …) + Icon |
| `src/stores/` | Svelte stores for navigation, monitor tick, settings |
| `src/lib/` | format helpers, mock data, pricing logic |
| `src-tauri/` | Rust backend — FS watcher, SQLite migrations, native commands |

Visual design follows handoff bundle `advocatos/` (in `~/.claude/projects/.../design_extract/`).

## Status

- Phase 1–4 complete: scaffold + design system + all 6 screens visually faithful to prototype, fed from `src/lib/data.js` mock.
- Phase 5 pending: wire SQLite reads, real FS watcher events from Rust → frontend session engine. See `instrucions.md` for full requirements.
