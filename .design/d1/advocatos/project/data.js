// Mock data for Advocatos prototype
const ROOT_FOLDER = "~/Dropbox/Escritório/Clientes";

// Cada cliente: valor = valorCobrado + valorPorCobrar
const CLIENTES = [
  { id: "c1",  nome: "Almeida & Sá Lda.",      ficheiros: 14, valor: 4280.00, horas: 31.5, valorCobrado: 2860.00, valorPorCobrar: 1420.00, ficheirosPorCobrar: 5 },
  { id: "c2",  nome: "Construções Mendes",     ficheiros: 9,  valor: 2745.50, horas: 19.2, valorCobrado: 2745.50, valorPorCobrar:    0.00, ficheirosPorCobrar: 0 },
  { id: "c3",  nome: "Imobiliária Tejo",       ficheiros: 22, valor: 6120.00, horas: 44.8, valorCobrado: 2890.00, valorPorCobrar: 3230.00, ficheirosPorCobrar: 8 },
  { id: "c4",  nome: "Pereira Advogados",      ficheiros: 6,  valor: 1380.00, horas: 11.0, valorCobrado:  680.00, valorPorCobrar:  700.00, ficheirosPorCobrar: 2 },
  { id: "c5",  nome: "Ribeiro & Filhos",       ficheiros: 11, valor: 3155.75, horas: 24.3, valorCobrado: 1640.00, valorPorCobrar: 1515.75, ficheirosPorCobrar: 4 },
  { id: "c6",  nome: "Têxteis Coelho",         ficheiros: 8,  valor: 1920.00, horas: 16.5, valorCobrado: 1920.00, valorPorCobrar:    0.00, ficheirosPorCobrar: 0 },
  { id: "c7",  nome: "Vinhos do Douro SA",     ficheiros: 17, valor: 5210.00, horas: 38.4, valorCobrado: 3140.00, valorPorCobrar: 2070.00, ficheirosPorCobrar: 6 },
  { id: "c8",  nome: "Sousa & Associados",     ficheiros: 5,  valor:  980.00, horas:  8.2, valorCobrado:  595.00, valorPorCobrar:  385.00, ficheirosPorCobrar: 2 },
  { id: "c9",  nome: "Farmácia Central",       ficheiros: 4,  valor:  760.50, horas:  6.4, valorCobrado:  760.50, valorPorCobrar:    0.00, ficheirosPorCobrar: 0 },
  { id: "c10", nome: "Tavares Transportes",    ficheiros: 13, valor: 3890.00, horas: 28.7, valorCobrado: 1980.00, valorPorCobrar: 1910.00, ficheirosPorCobrar: 5 },
];

const TIPOS = ["Contrato", "Procuração", "Parecer", "Petição", "Contestação", "Recurso", "Notificação"];

// Sessões recentes (Dashboard / Cliente detail)
// cobranca: "por-cobrar" | "cobrado"
const SESSOES = [
  { id: "s1",  ficheiro: "contrato-arrendamento-rua-sa-2026.docx",   clienteId: "c1",  tipo: "Contrato",    regra: "120,00 €/h",   inicio: "09:14", fim: null,    duracao: "01:42:18", valor: 204.46, estado: "aberto",  cobranca: "por-cobrar" },
  { id: "s2",  ficheiro: "procuracao-mendes-fiscal.pdf",              clienteId: "c2",  tipo: "Procuração",  regra: "85,00 € fixo", inicio: "08:55", fim: "09:22", duracao: "00:27:04", valor:  85.00, estado: "fechado", cobranca: "cobrado" },
  { id: "s3",  ficheiro: "parecer-juridico-tejo-zona-protegida.docx", clienteId: "c3",  tipo: "Parecer",     regra: "150,00 €/h",   inicio: "08:30", fim: "10:48", duracao: "02:18:00", valor: 345.00, estado: "fechado", cobranca: "por-cobrar" },
  { id: "s4",  ficheiro: "peticao-inicial-ribeiro-c-banco.docx",      clienteId: "c5",  tipo: "Petição",     regra: "140,00 €/h",   inicio: "10:02", fim: null,    duracao: "00:38:54", valor:  90.81, estado: "aberto",  cobranca: "por-cobrar" },
  { id: "s5",  ficheiro: "contrato-prestacao-servicos-douro.pdf",     clienteId: "c7",  tipo: "Contrato",    regra: "120,00 €/h",   inicio: "07:48", fim: "08:36", duracao: "00:48:12", valor:  96.40, estado: "fechado", cobranca: "por-cobrar" },
  { id: "s6",  ficheiro: "recurso-apelacao-tavares-2026.docx",        clienteId: "c10", tipo: "Recurso",     regra: "160,00 €/h",   inicio: "10:30", fim: null,    duracao: "00:11:02", valor:  29.42, estado: "aberto",  cobranca: "por-cobrar" },
  { id: "s7",  ficheiro: "contestacao-coelho-vs-fornecedor.docx",     clienteId: "c6",  tipo: "Contestação", regra: "140,00 €/h",   inicio: "07:12", fim: "08:24", duracao: "01:12:48", valor: 169.86, estado: "fechado", cobranca: "cobrado" },
  { id: "s8",  ficheiro: "procuracao-pereira-judicial.pdf",           clienteId: "c4",  tipo: "Procuração",  regra: "85,00 € fixo", inicio: "06:58", fim: "07:14", duracao: "00:16:22", valor:  85.00, estado: "fechado", cobranca: "cobrado" },
  { id: "s9",  ficheiro: "notificacao-sousa-incumprimento.docx",      clienteId: "c8",  tipo: "Notificação", regra: "95,00 €/h",    inicio: "06:42", fim: "07:06", duracao: "00:24:18", valor:  38.49, estado: "fechado", cobranca: "por-cobrar" },
  { id: "s10", ficheiro: "parecer-farmacia-central-laboral.docx",     clienteId: "c9",  tipo: "Parecer",     regra: "150,00 €/h",   inicio: "06:18", fim: "06:54", duracao: "00:36:00", valor:  90.00, estado: "fechado", cobranca: "cobrado" },
];

// Ficheiros monitorizados (live monitor)
const MONITOR_FILES = [
  { id: "m1",  ficheiro: "contrato-arrendamento-rua-sa-2026.docx",    cliente: "Almeida & Sá Lda.",     tipo: "Contrato",    regra: "120,00 €/h",   sessaoActual: 6138, totalDia: 6138, estado: "aberto" },
  { id: "m2",  ficheiro: "peticao-inicial-ribeiro-c-banco.docx",      cliente: "Ribeiro & Filhos",      tipo: "Petição",     regra: "140,00 €/h",   sessaoActual: 2334, totalDia: 2334, estado: "aberto" },
  { id: "m3",  ficheiro: "recurso-apelacao-tavares-2026.docx",        cliente: "Tavares Transportes",   tipo: "Recurso",     regra: "160,00 €/h",   sessaoActual:  662, totalDia:  662, estado: "aberto" },
  { id: "m4",  ficheiro: "procuracao-mendes-fiscal.pdf",              cliente: "Construções Mendes",    tipo: "Procuração",  regra: "85,00 € fixo", sessaoActual:    0, totalDia: 1624, estado: "fechado" },
  { id: "m5",  ficheiro: "parecer-juridico-tejo-zona-protegida.docx", cliente: "Imobiliária Tejo",      tipo: "Parecer",     regra: "150,00 €/h",   sessaoActual:    0, totalDia: 8280, estado: "fechado" },
  { id: "m6",  ficheiro: "contrato-prestacao-servicos-douro.pdf",     cliente: "Vinhos do Douro SA",    tipo: "Contrato",    regra: "120,00 €/h",   sessaoActual:    0, totalDia: 2892, estado: "fechado" },
  { id: "m7",  ficheiro: "contestacao-coelho-vs-fornecedor.docx",     cliente: "Têxteis Coelho",        tipo: "Contestação", regra: "140,00 €/h",   sessaoActual:    0, totalDia: 4368, estado: "fechado" },
  { id: "m8",  ficheiro: "procuracao-pereira-judicial.pdf",           cliente: "Pereira Advogados",     tipo: "Procuração",  regra: "85,00 € fixo", sessaoActual:    0, totalDia:  982, estado: "fechado" },
  { id: "m9",  ficheiro: "notificacao-sousa-incumprimento.docx",      cliente: "Sousa & Associados",    tipo: "Notificação", regra: "95,00 €/h",    sessaoActual:    0, totalDia: 1458, estado: "fechado" },
  { id: "m10", ficheiro: "parecer-farmacia-central-laboral.docx",     cliente: "Farmácia Central",      tipo: "Parecer",     regra: "150,00 €/h",   sessaoActual:    0, totalDia: 2160, estado: "fechado" },
  { id: "m11", ficheiro: "contrato-promessa-tejo-lote-7.docx",        cliente: "Imobiliária Tejo",      tipo: "Contrato",    regra: "120,00 €/h",   sessaoActual:    0, totalDia: 4140, estado: "fechado" },
  { id: "m12", ficheiro: "minuta-acordo-tavares-frota.docx",          cliente: "Tavares Transportes",   tipo: "Contrato",    regra: "120,00 €/h",   sessaoActual:    0, totalDia: 1860, estado: "fechado" },
];

// Regras de preço — ordem é prioridade
const REGRAS = [
  { id: "r1", palavra: "procuracao",  tipo: "fixo", valor:  85.00 },
  { id: "r2", palavra: "recurso",     tipo: "hora", valor: 160.00 },
  { id: "r3", palavra: "parecer",     tipo: "hora", valor: 150.00 },
  { id: "r4", palavra: "peticao",     tipo: "hora", valor: 140.00 },
  { id: "r5", palavra: "contestacao", tipo: "hora", valor: 140.00 },
  { id: "r6", palavra: "contrato",    tipo: "hora", valor: 120.00 },
  { id: "r7", palavra: "notificacao", tipo: "hora", valor:  95.00 },
];

const REGRA_PADRAO = { tipo: "hora", valor: 110.00 };

// Bar chart — valor faturado por semana
const SEMANAS = [
  { label: "S10", semana: "3–9 Mar",      valor: 2840 },
  { label: "S11", semana: "10–16 Mar",    valor: 3520 },
  { label: "S12", semana: "17–23 Mar",    valor: 2980 },
  { label: "S13", semana: "24–30 Mar",    valor: 4120 },
  { label: "S14", semana: "31 Mar–6 Abr", valor: 3780 },
  { label: "S15", semana: "7–13 Abr",     valor: 4650 },
  { label: "S16", semana: "14–20 Abr",    valor: 3920 },
  { label: "S17", semana: "21–27 Abr",    valor: 5210 },
  { label: "S18", semana: "28 Abr–4 Mai", valor: 4480 },
  { label: "S19", semana: "5–11 Mai",     valor: 5640 },
];

// Ficheiros por cliente — cobranca: "por-cobrar" | "cobrado" | "parcial"
const CLIENTE_FICHEIROS = {
  c3: [
    { id: "f-c3-1", ficheiro: "parecer-juridico-tejo-zona-protegida.docx", tipo: "Parecer",    regra: "150,00 €/h",          sessoes: 4, horas:  7.8, valor: 1170.00, cobranca: "por-cobrar" },
    { id: "f-c3-2", ficheiro: "contrato-promessa-tejo-lote-7.docx",        tipo: "Contrato",   regra: "120,00 €/h",          sessoes: 6, horas: 11.5, valor: 1380.00, cobranca: "cobrado" },
    { id: "f-c3-3", ficheiro: "contrato-promessa-tejo-lote-12.docx",       tipo: "Contrato",   regra: "120,00 €/h",          sessoes: 5, horas:  9.2, valor: 1104.00, cobranca: "por-cobrar" },
    { id: "f-c3-4", ficheiro: "procuracao-tejo-fiscal.pdf",                tipo: "Procuração", regra: "85,00 € fixo",        sessoes: 1, horas:  0.4, valor:   85.00, cobranca: "cobrado" },
    { id: "f-c3-5", ficheiro: "peticao-tejo-vs-camara.docx",               tipo: "Petição",    regra: "140,00 €/h",          sessoes: 8, horas: 12.7, valor: 1778.00, cobranca: "por-cobrar" },
    { id: "f-c3-6", ficheiro: "notas-reuniao-tejo-mai.docx",               tipo: "—",          regra: "110,00 €/h (padrão)", sessoes: 3, horas:  3.2, valor:  352.00, cobranca: "por-cobrar" },
    { id: "f-c3-7", ficheiro: "minuta-resposta-tejo.docx",                 tipo: "—",          regra: "110,00 €/h (padrão)", sessoes: 2, horas:  2.0, valor:  251.00, cobranca: "cobrado" },
  ],
};

const CLIENTE_SESSOES = {
  c3: [
    { data: "9 Mai", inicio: "08:30", fim: "10:48", duracao: "02:18:00", ficheiro: "parecer-juridico-tejo-zona-protegida.docx", valor: 345.00 },
    { data: "9 Mai", inicio: "11:02", fim: "12:34", duracao: "01:32:00", ficheiro: "contrato-promessa-tejo-lote-7.docx",        valor: 184.00 },
    { data: "8 Mai", inicio: "14:18", fim: "16:55", duracao: "02:37:00", ficheiro: "peticao-tejo-vs-camara.docx",               valor: 366.33 },
    { data: "8 Mai", inicio: "09:46", fim: "10:12", duracao: "00:26:00", ficheiro: "procuracao-tejo-fiscal.pdf",                valor:  85.00 },
    { data: "7 Mai", inicio: "10:08", fim: "13:24", duracao: "03:16:00", ficheiro: "contrato-promessa-tejo-lote-12.docx",       valor: 392.00 },
    { data: "7 Mai", inicio: "16:02", fim: "17:30", duracao: "01:28:00", ficheiro: "parecer-juridico-tejo-zona-protegida.docx", valor: 220.00 },
    { data: "6 Mai", inicio: "08:50", fim: "11:36", duracao: "02:46:00", ficheiro: "peticao-tejo-vs-camara.docx",               valor: 387.33 },
    { data: "6 Mai", inicio: "13:04", fim: "14:18", duracao: "01:14:00", ficheiro: "notas-reuniao-tejo-mai.docx",               valor: 135.67 },
  ],
};

// Itens por cobrar — usados no ecrã Cobranças
// Cada item representa um ficheiro com horas/valor não cobrados.
const COBRANCAS_PENDENTES = [
  { id: "p1",  clienteId: "c1",  ficheiro: "contrato-arrendamento-rua-sa-2026.docx",   tipo: "Contrato",    horas:  6.8, valor:  816.00 },
  { id: "p2",  clienteId: "c1",  ficheiro: "minuta-aditamento-almeida-sa.docx",        tipo: "Contrato",    horas:  3.4, valor:  408.00 },
  { id: "p3",  clienteId: "c1",  ficheiro: "parecer-laboral-almeida.docx",             tipo: "Parecer",     horas:  1.3, valor:  196.00 },
  { id: "p4",  clienteId: "c3",  ficheiro: "parecer-juridico-tejo-zona-protegida.docx",tipo: "Parecer",     horas:  6.4, valor:  960.00 },
  { id: "p5",  clienteId: "c3",  ficheiro: "contrato-promessa-tejo-lote-12.docx",      tipo: "Contrato",    horas:  9.2, valor: 1104.00 },
  { id: "p6",  clienteId: "c3",  ficheiro: "peticao-tejo-vs-camara.docx",              tipo: "Petição",     horas:  4.8, valor:  672.00 },
  { id: "p7",  clienteId: "c3",  ficheiro: "notas-reuniao-tejo-mai.docx",              tipo: "—",           horas:  3.2, valor:  352.00 },
  { id: "p8",  clienteId: "c4",  ficheiro: "contrato-pereira-locacao.docx",            tipo: "Contrato",    horas:  4.2, valor:  504.00 },
  { id: "p9",  clienteId: "c4",  ficheiro: "parecer-pereira-cooperacao.docx",          tipo: "Parecer",     horas:  1.3, valor:  196.00 },
  { id: "p10", clienteId: "c5",  ficheiro: "peticao-inicial-ribeiro-c-banco.docx",     tipo: "Petição",     horas:  6.1, valor:  854.00 },
  { id: "p11", clienteId: "c5",  ficheiro: "contestacao-ribeiro-resposta.docx",        tipo: "Contestação", horas:  3.4, valor:  476.00 },
  { id: "p12", clienteId: "c5",  ficheiro: "recurso-ribeiro-2026.docx",                tipo: "Recurso",     horas:  1.2, valor:  185.75 },
  { id: "p13", clienteId: "c7",  ficheiro: "contrato-prestacao-servicos-douro.pdf",    tipo: "Contrato",    horas:  7.5, valor:  900.00 },
  { id: "p14", clienteId: "c7",  ficheiro: "parecer-douro-exportacao.docx",            tipo: "Parecer",     horas:  4.8, valor:  720.00 },
  { id: "p15", clienteId: "c7",  ficheiro: "minuta-acordo-douro-distribuicao.docx",    tipo: "Contrato",    horas:  3.7, valor:  450.00 },
  { id: "p16", clienteId: "c8",  ficheiro: "notificacao-sousa-incumprimento.docx",     tipo: "Notificação", horas:  2.1, valor:  199.50 },
  { id: "p17", clienteId: "c8",  ficheiro: "parecer-sousa-laboral.docx",               tipo: "Parecer",     horas:  1.2, valor:  185.50 },
  { id: "p18", clienteId: "c10", ficheiro: "recurso-apelacao-tavares-2026.docx",       tipo: "Recurso",     horas:  4.3, valor:  688.00 },
  { id: "p19", clienteId: "c10", ficheiro: "contrato-tavares-frota.docx",              tipo: "Contrato",    horas:  6.2, valor:  744.00 },
  { id: "p20", clienteId: "c10", ficheiro: "minuta-acordo-tavares-frota.docx",         tipo: "Contrato",    horas:  3.9, valor:  478.00 },
];

// Histórico de cobranças passadas — usado em Análise
const HISTORICO_COBRANCAS = [
  { id: "h1", data: "2 Mai 2026",  hora: "14:18", clientes: ["Imobiliária Tejo", "Almeida & Sá Lda."], ficheiros:  9, valor: 4860.00 },
  { id: "h2", data: "28 Abr 2026", hora: "11:42", clientes: ["Vinhos do Douro SA"],                    ficheiros:  4, valor: 2140.00 },
  { id: "h3", data: "20 Abr 2026", hora: "16:05", clientes: ["Têxteis Coelho", "Farmácia Central"],    ficheiros:  6, valor: 2680.50 },
  { id: "h4", data: "12 Abr 2026", hora: "09:30", clientes: ["Construções Mendes"],                    ficheiros:  3, valor: 1745.50 },
  { id: "h5", data: "3 Abr 2026",  hora: "17:12", clientes: ["Imobiliária Tejo", "Tavares Transp."],   ficheiros:  7, valor: 3210.00 },
  { id: "h6", data: "26 Mar 2026", hora: "10:48", clientes: ["Sousa & Associados", "Pereira Adv."],    ficheiros:  4, valor: 1275.50 },
];

// Base de dados — Definições
const DB_INFO = {
  caminho: "~/Library/Application Support/Advocatos/advocatos.db",
  tamanho: "2,4 MB",
  registos: { sessoes: 1284, ficheiros: 109, clientes: 10, cobrancas: 18 },
  ultimoBackup: "9 Mai 2026 · 08:14",
};

window.LEXDATA = {
  ROOT_FOLDER, CLIENTES, TIPOS, SESSOES, MONITOR_FILES,
  REGRAS, REGRA_PADRAO, SEMANAS, CLIENTE_FICHEIROS, CLIENTE_SESSOES,
  COBRANCAS_PENDENTES, HISTORICO_COBRANCAS, DB_INFO,
};
