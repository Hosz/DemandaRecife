CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_members_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    dia_semana VARCHAR(10) NOT NULL,
    horario_inicio VARCHAR(10) NOT NULL,
    horario_fim VARCHAR(10) NOT NULL,
    demanda VARCHAR(50) DEFAULT 'Demanda média',
    tipo_demanda VARCHAR(20) DEFAULT 'media',
    vaga_pendente BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shifts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_shifts_tenant_dia ON shifts(tenant_id, dia_semana);

CREATE TABLE IF NOT EXISTS shift_assignments (
    id UUID PRIMARY KEY,
    shift_id UUID NOT NULL,
    funcionario_nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shift_assignments_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

CREATE INDEX idx_shift_assignments_shift ON shift_assignments(shift_id);
