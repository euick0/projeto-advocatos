import { writable, derived } from "svelte/store";

function detect() {
  if (typeof navigator === "undefined") return "macos";
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.userAgentData?.platform || navigator.platform || "").toLowerCase();
  if (plat.includes("win") || ua.includes("windows")) return "windows";
  if (plat.includes("mac") || ua.includes("mac os")) return "macos";
  if (plat.includes("linux") || ua.includes("linux")) return "linux";
  return "macos";
}

const detected = detect();

function loadOverride() {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem("dev_os_override");
  return v === "windows" || v === "macos" ? v : null;
}

export const isDev = !!(import.meta.env && import.meta.env.DEV);
export const detectedOs = detected;
export const osOverride = writable(loadOverride());

export function setOsOverride(v) {
  const val = v === "windows" || v === "macos" ? v : null;
  osOverride.set(val);
  if (typeof localStorage !== "undefined") {
    if (val) localStorage.setItem("dev_os_override", val);
    else localStorage.removeItem("dev_os_override");
  }
}

export const os = derived(osOverride, ($o) => (isDev && $o ? $o : detected));
export const isWindows = derived(os, ($os) => $os === "windows");
export const isMac = derived(os, ($os) => $os === "macos");
