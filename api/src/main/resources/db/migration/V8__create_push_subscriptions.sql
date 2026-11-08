CREATE TABLE push_subscriptions (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                    endpoint TEXT NOT NULL,
                                    p256dh VARCHAR(255) NOT NULL,
                                    auth VARCHAR(255) NOT NULL,
                                    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Um aparelho = um endpoint; reenviar a mesma subscription atualiza, não duplica
CREATE UNIQUE INDEX uq_push_endpoint ON push_subscriptions(endpoint);
CREATE INDEX idx_push_tenant ON push_subscriptions(tenant_id);