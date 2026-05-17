CREATE TABLE IF NOT EXISTS cobrancas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL DEFAULT (datetime('now')),
  total REAL NOT NULL DEFAULT 0,
  num_ficheiros INTEGER NOT NULL DEFAULT 0,
  num_sessoes INTEGER NOT NULL DEFAULT 0,
  clientes_json TEXT
);

ALTER TABLE sessoes ADD COLUMN cobranca_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_sessoes_cobranca ON sessoes(cobranca_id);
