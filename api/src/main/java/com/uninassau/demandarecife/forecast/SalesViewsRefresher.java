package com.uninassau.demandarecife.forecast;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SalesViewsRefresher {

    private static final List<String> VIEWS = List.of("mv_sales_daily", "mv_sales_hourly");

    private final JdbcTemplate jdbcTemplate;

    // Padrão: a cada 3 horas, no minuto zero. Pode trocar pelo application.properties
    @Scheduled(cron = "${app.sales-views.refresh-cron:0 0 */3 * * *}")
    public void refresh() {
        for (String view : VIEWS) {
            try {
                // CONCURRENTLY: não bloqueia leituras enquanto atualiza
                jdbcTemplate.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY " + view);
                log.info("View {} atualizada", view);
            } catch (Exception e) {
                // uma view com problema não impede a outra de atualizar
                log.error("Falha ao atualizar a view {}", view, e);
            }
        }
    }
}