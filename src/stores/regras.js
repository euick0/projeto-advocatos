import { writable, get } from "svelte/store";
import { listRegras, saveRegrasOrdered, redetectTypes, recalcSessoes } from "../lib/db.js";
import { defaultRule } from "./settings.js";

export const regras = writable([]);

export async function loadRegras() {
  const r = await listRegras();
  regras.set(r);
  return r;
}

export async function persistRegras(next) {
  const saved = await saveRegrasOrdered(next);
  regras.set(saved);
  await redetectTypes(saved);
  await recalcSessoes(saved, get(defaultRule));
  return saved;
}

export async function addRegra({ palavra, tipo, valor }) {
  const current = await listRegras();
  const next = [...current, { palavra, tipo, valor: parseFloat(valor) }];
  return persistRegras(next);
}

export async function removeRegra(id) {
  const current = await listRegras();
  return persistRegras(current.filter((r) => r.id !== id));
}

export async function moveRegra(idx, dir) {
  const current = await listRegras();
  const target = idx + dir;
  if (target < 0 || target >= current.length) return current;
  const next = [...current];
  [next[idx], next[target]] = [next[target], next[idx]];
  return persistRegras(next);
}

export async function updateRegra(id, patch) {
  const current = await listRegras();
  return persistRegras(current.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}
