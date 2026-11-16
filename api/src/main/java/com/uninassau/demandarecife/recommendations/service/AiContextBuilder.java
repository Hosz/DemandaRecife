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
import com.uninassau.demandarecife.tenants.finder.TenantFinder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiContextBuilder {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");

    private final TenantFinder tenantFinder;
    private final WeatherFinder weatherFinder;
    private final HolidayFinder holidayFinder;
    private final ReplenishmentService replenishmentService;
    private final TeamService teamService;
    private final AlertService alertService;
    @Lazy
    private final DailyBriefingService dailyBriefingService;

    public MerchantDailyContext buildContext(UUID tenantId, LocalDate dataReferencia) {
        LocalDate hoje = (dataReferencia != null) ? dataReferencia : LocalDate.now(ZONA);
        String diaSemanaCod = toDiaSemanaCode(hoje.getDayOfWeek());

        Tenant tenant = tenantFinder.findById(tenantId);
        boolean usarBenchmarks = true;
        String nicho = "Varejo Geral";
        String cidade = "Recife";
        String estado = "PE";
        String bairro = "Recife";
        String horarios = "08:00 às 18:00";
        BigDecimal ticketMedio = new BigDecimal("35.00");

        if (tenant != null) {
            if (tenant.getNichoAtuacao() != null && !tenant.getNichoAtuacao().isBlank()) nicho = tenant.getNichoAtuacao();
            if (tenant.getCidade() != null && !tenant.getCidade().isBlank()) cidade = tenant.getCidade();
            if (tenant.getEstado() != null && !tenant.getEstado().isBlank()) estado = tenant.getEstado();
            if (tenant.getBairro() != null && !tenant.getBairro().isBlank()) bairro = tenant.getBairro();
            if (tenant.getTicketMedio() != null && tenant.getTicketMedio().compareTo(BigDecimal.ZERO) > 0) {
                ticketMedio = tenant.getTicketMedio();
            }

            if (tenant.getPerfil() != null) {
                if (tenant.getPerfil().getHorarioAbertura() != null && tenant.getPerfil().getHorarioFechamento() != null) {
                    horarios = tenant.getPerfil().getHorarioAbertura() + " às " + tenant.getPerfil().getHorarioFechamento();
                }
                if (Boolean.FALSE.equals(tenant.getPerfil().getUsarBenchmarksColdStart())) {
                    usarBenchmarks = false;
                }
            }
        }

        // 1. Clima
        String climaCondicao = "Ensolarado";
        String climaTemp = "28°C";
        try {
            Optional<WeatherHistory> weatherOpt = weatherFinder.findByCidadeAndData(cidade, hoje);
            if (weatherOpt.isPresent()) {
                WeatherHistory w = weatherOpt.get();
                if (w.getCondicao() != null && !w.getCondicao().isBlank()) climaCondicao = w.getCondicao();
                if (w.getTempMaxima() != null) climaTemp = Math.round(w.getTempMaxima().doubleValue()) + "°C";
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar clima para contexto: {}", e.getMessage());
        }

        // 2. Feriados e Eventos próximos (hoje até daqui a 3 dias)
        List<String> feriados = new ArrayList<>();
        try {
            List<HolidayEvent> eventos = holidayFinder.findByPeriodo(hoje, hoje.plusDays(3));
            if (eventos != null) {
                for (HolidayEvent ev : eventos) {
                    feriados.add(ev.getNome() + " (" + ev.getDataEvento() + ")");
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar feriados para contexto: {}", e.getMessage());
        }

        // 3. Compras e Rupturas Críticas
        List<ReplenishmentSuggestion> comprasCriticas = List.of();
        try {
            comprasCriticas = replenishmentService.suggestions(tenantId).stream()
                    .filter(ReplenishmentSuggestion::comprarAgora)
                    .limit(5)
                    .toList();
        } catch (Exception e) {
            log.warn("Erro ao buscar reposições para contexto: {}", e.getMessage());
        }

        // 4. Fluxo e Horário de Pico
        String peakHour = "18:00";
        String peakRange = "entre 17h e 19h";
        try {
            FlowCalculationResult flowResult = dailyBriefingService.calcularFluxoEPico(tenantId, usarBenchmarks);
            if (flowResult != null) {
                if (flowResult.peakHour() != null) peakHour = flowResult.peakHour();
                if (flowResult.peakRange() != null) peakRange = flowResult.peakRange();
            }
        } catch (Exception e) {
            log.warn("Erro ao calcular fluxo para contexto: {}", e.getMessage());
        }

        // 5. Turnos de Equipe do dia
        List<ShiftDto> turnos = List.of();
        try {
            turnos = teamService.listShifts(tenantId, diaSemanaCod);
        } catch (Exception e) {
            log.warn("Erro ao buscar turnos para contexto: {}", e.getMessage());
        }

        // 6. Alertas operacionais ativos
        int totalAlertas = 0;
        try {
            totalAlertas = alertService.listar(tenantId, "ATIVO", false).size();
        } catch (Exception e) {
            log.warn("Erro ao buscar alertas para contexto: {}", e.getMessage());
        }

        return new MerchantDailyContext(
                tenantId,
                hoje,
                diaSemanaCod,
                nicho,
                cidade + ", " + estado,
                bairro,
                horarios,
                ticketMedio,
                climaCondicao,
                climaTemp,
                feriados,
                comprasCriticas,
                peakHour,
                peakRange,
                turnos,
                totalAlertas,
                usarBenchmarks
        );
    }

    private String toDiaSemanaCode(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "SEG";
            case TUESDAY -> "TER";
            case WEDNESDAY -> "QUA";
            case THURSDAY -> "QUI";
            case FRIDAY -> "SEX";
            case SATURDAY -> "SAB";
            case SUNDAY -> "DOM";
        };
    }
}
