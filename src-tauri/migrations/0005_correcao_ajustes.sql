-- Manual hours correction (spec 6.4): preserve original values for audit.
ALTER TABLE sessoes ADD COLUMN inicio_original TEXT;
ALTER TABLE sessoes ADD COLUMN fim_original TEXT;
ALTER TABLE sessoes ADD COLUMN duracao_seg_original INTEGER;
ALTER TABLE sessoes ADD COLUMN valor_original REAL;
ALTER TABLE sessoes ADD COLUMN corrigido_em TEXT;

-- Billing adjustments (spec 8.2/8.3): store base, total adjustment and the
-- per-scope adjustment breakdown applied at the moment of cobrança.
ALTER TABLE cobrancas ADD COLUMN base REAL NOT NULL DEFAULT 0;
ALTER TABLE cobrancas ADD COLUMN ajuste_total REAL NOT NULL DEFAULT 0;
ALTER TABLE cobrancas ADD COLUMN ajustes_json TEXT;
