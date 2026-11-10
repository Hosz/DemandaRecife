-- ==============================================================================
-- V11: Suporte a toggle de Cold Start, detalhes operacionais de turnos e campanhas
-- ==============================================================================

-- 1. Cold start benchmark toggle no perfil do tenant
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS usar_benchmarks_cold_start BOOLEAN DEFAULT TRUE;

-- 2. Detalhes operacionais dos turnos da equipe
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS funcao VARCHAR(100) DEFAULT 'Geral';
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS intervalo VARCHAR(50);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS observacoes VARCHAR(255);

-- 3. Detalhes de campanhas promocionais (evento/feriado vinculado e data fim)
ALTER TABLE promotional_campaigns ADD COLUMN IF NOT EXISTS evento_vinculado VARCHAR(150);
ALTER TABLE promotional_campaigns ADD COLUMN IF NOT EXISTS data_fim VARCHAR(50);
