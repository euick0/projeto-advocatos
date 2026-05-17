import { writable } from "svelte/store";

export const screen = writable("dashboard");
export const clienteId = writable(null);
export const periodo = writable("mes");
// caminho of a file to auto-expand + scroll to on the client detail page
export const highlightFicheiro = writable(null);

export const goCliente = (id, caminho = null) => {
  highlightFicheiro.set(caminho);
  clienteId.set(id);
  screen.set("cliente-detalhe");
};

export const navigate = (s) => screen.set(s);
