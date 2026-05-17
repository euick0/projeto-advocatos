CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  pasta TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS regras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  palavra TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('hora','fixo')),
  valor REAL NOT NULL,
  prioridade INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ficheiros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  caminho TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo_detetado TEXT,
  regra_id INTEGER REFERENCES regras(id)
);

CREATE TABLE IF NOT EXISTS sessoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ficheiro_id INTEGER NOT NULL REFERENCES ficheiros(id) ON DELETE CASCADE,
  inicio TEXT NOT NULL,
  fim TEXT,
  duracao_seg INTEGER,
  valor REAL,
  estado TEXT NOT NULL CHECK(estado IN ('aberto','fechado'))
);
CREATE INDEX IF NOT EXISTS idx_sessoes_ficheiro ON sessoes(ficheiro_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_inicio ON sessoes(inicio);

CREATE TABLE IF NOT EXISTS settings (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (chave, valor) VALUES
  ('root_folder', ''),
  ('idle_threshold_min', '5'),
  ('currency', 'EUR');


