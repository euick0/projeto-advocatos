import { writable, get } from "svelte/store";
import { getSetting, setSetting, recalcSessoes } from "../lib/db.js";
import { regras } from "./regras.js";

export const rootFolder = writable("");
export const idleThresholdMin = writable(5);
export const currency = writable("EUR");
export const autoStart = writable(false);
export const openMinimized = writable(false);
export const defaultRule = writable({ tipo: "hora", valor: 110.0 });
export const settingsReady = writable(false);

export async function loadSettings() {
  const [r, t, c, as, om, drt, drv] = await Promise.all([
    getSetting("root_folder", ""),
    getSetting("idle_threshold_min", "5"),
    getSetting("currency", "EUR"),
    getSetting("auto_start", "0"),
    getSetting("open_minimized", "0"),
    getSetting("default_rule_tipo", "hora"),
    getSetting("default_rule_valor", "110"),
  ]);
  rootFolder.set(r || "");
  idleThresholdMin.set(parseInt(t, 10) || 5);
  currency.set(c || "EUR");
  autoStart.set(as === "1");
  openMinimized.set(om === "1");
  defaultRule.set({ tipo: drt || "hora", valor: parseFloat(drv) || 110.0 });
  settingsReady.set(true);
}

export async function saveRootFolder(path) {
  rootFolder.set(path);
  await setSetting("root_folder", path);
}

export async function saveIdleThreshold(min) {
  idleThresholdMin.set(min);
  await setSetting("idle_threshold_min", String(min));
}

export async function saveCurrency(cur) {
  currency.set(cur);
  await setSetting("currency", cur);
}

export async function saveAutoStart(enabled) {
  autoStart.set(enabled);
  await setSetting("auto_start", enabled ? "1" : "0");
}

export async function saveOpenMinimized(enabled) {
  openMinimized.set(enabled);
  await setSetting("open_minimized", enabled ? "1" : "0");
}

export async function saveDefaultRule(rule) {
  defaultRule.set({ ...rule });
  await setSetting("default_rule_tipo", rule.tipo);
  await setSetting("default_rule_valor", String(rule.valor));
  await recalcSessoes(get(regras), rule);
}

export function getRoot() {
  return get(rootFolder);
}
