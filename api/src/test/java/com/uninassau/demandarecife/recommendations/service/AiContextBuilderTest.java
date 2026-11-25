package com.uninassau.demandarecife.recommendations.service;

import com.uninassau.demandarecife.alerts.service.AlertService;
import com.uninassau.demandarecife.dashboard.service.DailyBriefingService;
import com.uninassau.demandarecife.dashboard.service.DailyBriefingService.FlowCalculationResult;
import com.uninassau.demandarecife.external.entity.HolidayEvent;
import com.uninassau.demandarecife.external.entity.WeatherHistory;
import com.uninassau.demandarecife.external.finder.HolidayFinder;
import com.uninassau.demandarecife.external.finder.WeatherFinder;
import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.replenishment.service.ReplenishmentService;
import com.uninassau.demandarecife.team.dto.ShiftDto;
import com.uninassau.demandarecife.team.service.TeamService;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import com.uninassau.demandarecife.tenants.finder.TenantFinder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiContextBuilderTest {

    @Mock
    private TenantFinder tenantFinder;

    @Mock
    private WeatherFinder weatherFinder;

    @Mock
    private HolidayFinder holidayFinder;

    @Mock
    private ReplenishmentService replenishmentService;

    @Mock
    private TeamService teamService;

    @Mock
    private AlertService alertService;

    @Mock
    private DailyBriefingService dailyBriefingService;

    @InjectMocks
    private AiContextBuilder contextBuilder;

    private UUID tenantId;
    private LocalDate dataAlvo;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        dataAlvo = LocalDate.of(2026, 6, 24); // Quarta-feira
    }

    @Test
    @DisplayName("Deve montar contexto completo com todas as variáveis operacionais e exógenas")
    void deveMontarContextoCompleto() {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setNome("Padaria Boa Viagem");
        tenant.setNichoAtuacao("Padaria / Confeitaria");
        tenant.setCidade("Recife");
        tenant.setEstado("PE");
        tenant.setBairro("Boa Viagem");
        tenant.setTicketMedio(new BigDecimal("42.00"));

        TenantProfile perfil = new TenantProfile();
        perfil.setHorarioAbertura(LocalTime.of(6, 30));
        perfil.setHorarioFechamento(LocalTime.of(20, 0));
        perfil.setUsarBenchmarksColdStart(true);
        tenant.setPerfil(perfil);

        when(tenantFinder.findById(tenantId)).thenReturn(tenant);

        WeatherHistory weather = new WeatherHistory();
        weather.setCondicao("Chuva rápida");
        weather.setTempMaxima(new BigDecimal("28.4"));
        when(weatherFinder.findByCidadeAndData("Recife", dataAlvo)).thenReturn(Optional.of(weather));

        HolidayEvent evento = new HolidayEvent();
        evento.setNome("São João");
        evento.setDataEvento(dataAlvo);
        when(holidayFinder.findByPeriodo(eq(dataAlvo), any())).thenReturn(List.of(evento));

        ReplenishmentSuggestion sug = new ReplenishmentSuggestion(
                UUID.randomUUID(), "Queijo Coalho", 2, 10, 25, true, 15, ReplenishmentSuggestion.Metodo.PREVISAO
        );
        when(replenishmentService.suggestions(tenantId)).thenReturn(List.of(sug));

        when(dailyBriefingService.calcularFluxoEPico(tenantId, true))
                .thenReturn(new FlowCalculationResult(List.of(), "17:00", "entre 16h e 18h", false));

        ShiftDto turno = new ShiftDto(UUID.randomUUID(), "QUA", "14h–20h", "14:00", "20:00", "alta", "alta", true, List.of("Marcos"));
        when(teamService.listShifts(tenantId, "QUA")).thenReturn(List.of(turno));

        when(alertService.listar(tenantId, "ATIVO", false)).thenReturn(List.of());

        MerchantDailyContext ctx = contextBuilder.buildContext(tenantId, dataAlvo);

        assertThat(ctx).isNotNull();
        assertThat(ctx.tenantId()).isEqualTo(tenantId);
        assertThat(ctx.diaSemana()).isEqualTo("QUA");
        assertThat(ctx.nicho()).isEqualTo("Padaria / Confeitaria");
        assertThat(ctx.bairro()).isEqualTo("Boa Viagem");
        assertThat(ctx.climaCondicao()).isEqualTo("Chuva rápida");
        assertThat(ctx.climaTemperatura()).isEqualTo("28°C");
        assertThat(ctx.feriadosProximos()).contains("São João (2026-06-24)");
        assertThat(ctx.comprasCriticas()).hasSize(1);
        assertThat(ctx.horarioPico()).isEqualTo("17:00");
        assertThat(ctx.turnosDoDia()).hasSize(1);
    }
}
