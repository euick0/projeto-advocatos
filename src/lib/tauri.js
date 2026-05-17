// Lazy-load Tauri APIs. Falls back to no-op in pure web dev (vite dev outside tauri).
export const isTauri = () =>
  typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

export async function pickFolder() {
  if (!isTauri()) {
    alert("Seletor de pastas só disponível na aplicação Tauri. Em dev web, escreva o caminho manualmente.");
    return null;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const picked = await open({ directory: true, multiple: false });
  return typeof picked === "string" ? picked : null;
}

export async function pickSaveFile(defaultPath) {
  if (!isTauri()) return null;
  const { save } = await import("@tauri-apps/plugin-dialog");
  return await save({ defaultPath });
}

// Recursive scan: returns { clientes: [{ nome, pasta, ficheiros: [{ nome, caminho }] }] }.
// Top-level subdir = cliente. Every file under it (recursive) = ficheiro.
// Whole walk runs in Rust to avoid IPC roundtrip per directory.
export async function scanRoot(root) {
  if (!isTauri() || !root) return { clientes: [] };
  try {
    const clientes = await invoke("scan_root", { root });
    return { clientes: clientes || [] };
  } catch (e) {
    console.error("scanRoot failed:", e);
    return { clientes: [], error: String(e) };
  }
}

export function joinPath(a, b) {
  if (!a) return b;
  const sep = a.includes("\\") && !a.includes("/") ? "\\" : "/";
  if (a.endsWith("/") || a.endsWith("\\")) return a + b;
  return a + sep + b;
}

export function basename(p) {
  if (!p) return "";
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

export function dirname(p) {
  if (!p) return "";
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(0, i) : "";
}

// Top-level cliente folder for a path under root.
export function clienteFromPath(path, root) {
  if (!path || !root) return null;
  const norm = (s) => s.replace(/\\/g, "/").replace(/\/+$/, "");
  const np = norm(path);
  const nr = norm(root);
  if (!np.startsWith(nr + "/")) return null;
  const rest = np.slice(nr.length + 1);
  const idx = rest.indexOf("/");
  return idx >= 0 ? rest.slice(0, idx) : rest;
}

let _invoke = null;
export async function invoke(cmd, args) {
  if (!isTauri()) return null;
  if (!_invoke) {
    const mod = await import("@tauri-apps/api/core");
    _invoke = mod.invoke;
  }
  return _invoke(cmd, args);
}

let _listen = null;
export async function listen(event, handler) {
  if (!isTauri()) return () => {};
  if (!_listen) {
    const mod = await import("@tauri-apps/api/event");
    _listen = mod.listen;
  }
  return _listen(event, handler);
}

let _win = null;
async function getWin() {
  if (!isTauri()) return null;
  if (!_win) {
    const mod = await import("@tauri-apps/api/window");
    _win = mod.getCurrentWindow();
  }
  return _win;
}

export async function winMinimize() {
  const w = await getWin();
  if (w) await w.minimize();
}

export async function winToggleMaximize() {
  const w = await getWin();
  if (w) await w.toggleMaximize();
}

export async function winClose() {
  const w = await getWin();
  if (w) await w.close();
}

export async function winIsMaximized() {
  const w = await getWin();
  if (!w) return false;
  return await w.isMaximized();
}

export async function winOnResize(cb) {
  const w = await getWin();
  if (!w) return () => {};
  return await w.onResized(cb);
}

export async function winShow() {
  const w = await getWin();
  if (w) await w.show();
}

export async function winUnminimize() {
  const w = await getWin();
  if (w) await w.unminimize();
}

export async function winHide() {
  const w = await getWin();
  if (w) await w.hide();
}

let _autostart = null;
async function getAutostart() {
  if (!isTauri()) return null;
  if (!_autostart) {
    _autostart = await import("@tauri-apps/plugin-autostart");
  }
  return _autostart;
}

export async function setAutostart(enabled) {
  const m = await getAutostart();
  if (!m) return false;
  try {
    const isOn = await m.isEnabled();
    if (enabled && !isOn) await m.enable();
    else if (!enabled && isOn) await m.disable();
    return true;
  } catch (e) {
    console.error("autostart toggle failed:", e);
    return false;
  }
}

export async function isAutostartEnabled() {
  const m = await getAutostart();
  if (!m) return false;
  try { return await m.isEnabled(); } catch { return false; }
}
