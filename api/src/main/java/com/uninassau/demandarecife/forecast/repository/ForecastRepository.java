package com.uninassau.demandarecife.forecast.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ForecastRepository {

    private final EntityManager em;

    public record TenantSettings(String nicho, String diasFuncionamento, Boolean usarBenchmarksColdStart) {
        public TenantSettings(String nicho, String diasFuncionamento) {
            this(nicho, diasFuncionamento, true);
        }
    }

    /** produto -> (dia -> total vendido). Só dias com venda; os dias sem venda o cálculo trata. */
    @SuppressWarnings("unchecked")
    public Map<UUID, Map<LocalDate, Integer>> vendasPorDia(UUID tenantId, LocalDate inicio, LocalDate fimExclusivo) {
        List<Object[]> rows = em.createNativeQuery("""
        SELECT product_id, dia, total_vendido
        FROM mv_sales_daily
        WHERE tenant_id = :tenantId
          AND dia >= :inicio AND dia < :fim
        """)
                .setParameter("tenantId", tenantId)
                .setParameter("inicio", inicio)
                .setParameter("fim", fimExclusivo)
                .getResultList();

        Map<UUID, Map<LocalDate, Integer>> result = new HashMap<>();
        for (Object[] r : rows) {
            result.computeIfAbsent(toUuid(r[0]), k -> new HashMap<>())
                    .put(toDate(r[1]), ((Number) r[2]).intValue());
        }
        return result;
    }

    /** produto -> data da primeira venda (início do histórico). */
    @SuppressWarnings("unchecked")
    public Map<UUID, LocalDate> primeiraVenda(UUID tenantId) {
        List<Object[]> rows = em.createNativeQuery("""
        SELECT product_id, MIN(dia)
        FROM mv_sales_daily
        WHERE tenant_id = :tenantId
        GROUP BY product_id
        """)
                .setParameter("tenantId", tenantId)
                .getResultList();

        Map<UUID, LocalDate> result = new HashMap<>();
        for (Object[] r : rows) result.put(toUuid(r[0]), toDate(r[1]));
        return result;
    }

    @SuppressWarnings("unchecked")
    public TenantSettings configuracoes(UUID tenantId) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT t.nicho_atuacao, p.dias_funcionamento, p.usar_benchmarks_cold_start
                FROM tenants t
                LEFT JOIN tenant_profiles p ON p.tenant_id = t.id
                WHERE t.id = :tenantId
                """)
                .setParameter("tenantId", tenantId)
                .getResultList();

        if (rows.isEmpty()) return new TenantSettings(null, null, true);
        Object[] r = rows.get(0);
        Boolean usarColdStart = r.length > 2 && r[2] != null ? (Boolean) r[2] : true;
        return new TenantSettings((String) r[0], (String) r[1], usarColdStart);
    }

    // O driver pode devolver tipos diferentes conforme a versão, então convertemos com segurança.
    private static UUID toUuid(Object o) {
        return o instanceof UUID u ? u : UUID.fromString(o.toString());
    }

    private static LocalDate toDate(Object o) {
        if (o instanceof LocalDate d) return d;
        if (o instanceof java.sql.Date d) return d.toLocalDate();
        return LocalDate.parse(o.toString().substring(0, 10));
    }
}