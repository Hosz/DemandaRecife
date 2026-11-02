package com.uninassau.demandarecife.forecast;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SalesViewsRefresherTest {

    @Mock JdbcTemplate jdbcTemplate;
    @InjectMocks SalesViewsRefresher refresher;

    @Test
    void atualizaAsDuasViewsEmModoConcorrente() {
        refresher.refresh();

        verify(jdbcTemplate).execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_daily");
        verify(jdbcTemplate).execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_hourly");
    }

    @Test
    void falhaEmUmaViewNaoImpedeAAtualizacaoDaOutra() {
        doThrow(new RuntimeException("erro")).when(jdbcTemplate)
                .execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_daily");

        refresher.refresh();

        verify(jdbcTemplate).execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_hourly");
    }
}