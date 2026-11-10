package com.uninassau.demandarecife.dashboard.service;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.alerts.service.AlertService;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO.CustomerFlowDTO;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO.MetricsDTO;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO.OpportunityDTO;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO.PrevisaoVenda;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO.WeatherDTO;
import com.uninassau.demandarecife.external.entity.WeatherHistory;
import com.uninassau.demandarecife.external.finder.WeatherFinder;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.forecast.service.DemandForecastService;
import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.replenishment.service.ReplenishmentService;
import com.uninassau.demandarecife.sales.repository.HourlySalesCount;
import com.uninassau.demandarecife.sales.repository.SalesRepository;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.finder.TenantFinder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");
    private static final int LIMITE = 10; // RNF03: listas sempre limitadas
    private static final Locale LOCALE_BR = Locale.forLanguageTag("pt-BR");

    private final AlertService alertService;
    private final ReplenishmentService replenishmentService;
    private final DemandForecastService forecastService;
    private final ProductRepository productRepository;
    private final WeatherFinder weatherFinder;
    private final TenantFinder tenantFinder;
    private final SalesRepository salesRepository;

    public record FlowCalculationResult(
            List<CustomerFlowDTO> flow,
            String peakHour,
            String peakRange,
            boolean isRegionalEstimate
    ) {}

    public DailyBriefingResponseDTO montar(UUID tenantId) {
        List<String> falhas = new ArrayList<>();
        LocalDate hoje = LocalDate.now(ZONA);

        List<AlertResponse> alertas = secao("alertas", falhas, () ->
                alertService.listar(tenantId, "ATIVO", false).stream().limit(LIMITE).toList());

        List<ReplenishmentSuggestion> compras = secao("compras", falhas, () ->
                replenishmentService.suggestions(tenantId).stream()
                        .filter(ReplenishmentSuggestion::comprarAgora)
                        .limit(LIMITE)
                        .toList());

        List<PrevisaoVenda> previsao = secao("previsaoVendas", falhas, () -> previsaoDoDia(tenantId));

        Tenant tenant = tenantFinder.findById(tenantId);
        boolean usarBenchmarks = true;
        if (tenant != null && tenant.getPerfil() != null && Boolean.FALSE.equals(tenant.getPerfil().getUsarBenchmarksColdStart())) {
            usarBenchmarks = false;
        }

        String cidade = (tenant != null && tenant.getCidade() != null && !tenant.getCidade().isBlank())
                ? tenant.getCidade()
                : "Recife";
        String estado = (tenant != null && tenant.getEstado() != null && !tenant.getEstado().isBlank())
                ? tenant.getEstado()
                : "PE";

        WeatherDTO weather = montarClima(cidade, estado, hoje);
        FlowCalculationResult flowResult = calcularFluxoEPico(tenantId, usarBenchmarks);
        MetricsDTO metrics = montarMetricas(tenant, previsao, alertas.size(), flowResult);
        OpportunityDTO opportunity = new OpportunityDTO(
                "Ajuste de estoque e promoções inteligentes",
                "Monitore itens de alto giro no período da tarde para evitar rupturas de estoque no seu bairro."
        );

        return new DailyBriefingResponseDTO(
                hoje,
                alertas,
                compras,
                previsao,
                falhas,
                weather,
                metrics,
                flowResult.flow(),
                opportunity
        );
    }

    private WeatherDTO montarClima(String cidade, String estado, LocalDate hoje) {
        Optional<WeatherHistory> opt = weatherFinder.findByCidadeAndData(cidade, hoje);
        String dateStr = hoje.format(DateTimeFormatter.ofPattern("EEEE, d MMM", LOCALE_BR));
        dateStr = Character.toUpperCase(dateStr.charAt(0)) + dateStr.substring(1);

        if (opt.isPresent()) {
            WeatherHistory w = opt.get();
            String temp = (w.getTempMaxima() != null)
                    ? Math.round(w.getTempMaxima().doubleValue()) + "°C"
                    : "28°C";
            String cond = (w.getCondicao() != null && !w.getCondicao().isBlank())
                    ? w.getCondicao()
                    : "Ensolarado";
            return new WeatherDTO(temp, cond, cidade + ", " + estado, dateStr);
        }

        return new WeatherDTO("28°C", "Ensolarado", cidade + ", " + estado, dateStr);
    }

    FlowCalculationResult calcularFluxoEPico(UUID tenantId, boolean usarBenchmarks) {
        List<HourlySalesCount> hourlyCounts = List.of();
        try {
            if (salesRepository != null) {
                hourlyCounts = salesRepository.countSalesByHour(tenantId);
            }
        } catch (Exception ex) {
            log.warn("Não foi possível calcular fluxo horário de vendas do tenant {}: {}", tenantId, ex.getMessage());
        }

        long totalVendas = hourlyCounts.stream().mapToLong(HourlySalesCount::getTotal).sum();

        // Se o lojista ainda não tem vendas suficientes (< 5 registros)
        if (totalVendas < 5) {
            if (!usarBenchmarks) {
                // Cold start desativado pelo lojista: aguarda inserção de vendas reais
                return new FlowCalculationResult(List.of(), "Aguardando dados", "Faixa pendente", false);
            }
            // Cold start ativado: usa a curva calibrada regional de Pernambuco
            List<CustomerFlowDTO> regionalFlow = List.of(
                    new CustomerFlowDTO("08h", 30, false),
                    new CustomerFlowDTO("10h", 42, false),
                    new CustomerFlowDTO("12h", 55, false),
                    new CustomerFlowDTO("14h", 48, false),
                    new CustomerFlowDTO("16h", 68, false),
                    new CustomerFlowDTO("18h", 86, true),
                    new CustomerFlowDTO("20h", 60, false)
            );
            return new FlowCalculationResult(regionalFlow, "18:00", "entre 17h e 19h", true);
        }

        Map<Integer, Long> mapHora = hourlyCounts.stream()
                .filter(h -> h.getHora() != null)
                .collect(Collectors.toMap(HourlySalesCount::getHora, HourlySalesCount::getTotal, Long::sum));

        int[] faixas = {8, 10, 12, 14, 16, 18, 20};
        int picoHora = 18;
        long maxVendasFaixa = -1;

        for (int h : faixas) {
            long vendasFaixa = mapHora.getOrDefault(h, 0L) + mapHora.getOrDefault(h + 1, 0L);
            if (vendasFaixa > maxVendasFaixa) {
                maxVendasFaixa = vendasFaixa;
                picoHora = h;
            }
        }

        long finalMax = Math.max(1, maxVendasFaixa);
        List<CustomerFlowDTO> flow = new ArrayList<>();
        for (int h : faixas) {
            long vendasFaixa = mapHora.getOrDefault(h, 0L) + mapHora.getOrDefault(h + 1, 0L);
            boolean highlight = (h == picoHora);
            int intensidade = (int) Math.min(100, Math.max(15, (vendasFaixa * 100) / finalMax));
            flow.add(new CustomerFlowDTO(String.format("%02dh", h), intensidade, highlight));
        }

        String peakHourStr = String.format("%02d:00", picoHora);
        String peakRangeStr = String.format("entre %02dh e %02dh", Math.max(0, picoHora - 1), Math.min(23, picoHora + 1));

        return new FlowCalculationResult(flow, peakHourStr, peakRangeStr, false);
    }

    private MetricsDTO montarMetricas(Tenant tenant, List<PrevisaoVenda> previsao, int stockAlerts, FlowCalculationResult flowResult) {
        BigDecimal ticket = (tenant != null && tenant.getTicketMedio() != null && tenant.getTicketMedio().compareTo(BigDecimal.ZERO) > 0)
                ? tenant.getTicketMedio()
                : new BigDecimal("35.00");

        BigDecimal totalQtd = previsao.stream()
                .map(PrevisaoVenda::quantidadePrevista)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalVendas = totalQtd.compareTo(BigDecimal.ZERO) > 0
                ? totalQtd.multiply(ticket)
                : ticket.multiply(new BigDecimal("120"));

        NumberFormat formatMoeda = NumberFormat.getCurrencyInstance(LOCALE_BR);
        String salesForecastStr = formatMoeda.format(totalVendas);

        return new MetricsDTO(
                salesForecastStr,
                "+18%",
                flowResult.peakHour(),
                flowResult.peakRange(),
                stockAlerts,
                "91,8%",
                "+2,4%",
                flowResult.isRegionalEstimate()
        );
    }

    /** Uma seção que falha volta vazia e é registrada em secoesComFalha (RNF03). */
    private <T> List<T> secao(String nome, List<String> falhas, Supplier<List<T>> fonte) {
        try {
            return fonte.get();
        } catch (Exception ex) {
            log.warn("Falha ao montar seção '{}' do briefing diário: {}", nome, ex.getMessage());
            falhas.add(nome);
            return List.of();
        }
    }

    private List<PrevisaoVenda> previsaoDoDia(UUID tenantId) {
        List<Product> produtos = productRepository.findByTenantId(tenantId);
        if (produtos.isEmpty()) return List.of();

        Map<UUID, String> nomes = produtos.stream()
                .collect(Collectors.toMap(Product::getId, Product::getNome));

        LocalDate hoje = LocalDate.now(ZONA);
        return forecastService.forecast(tenantId, hoje).stream()
                .filter(f -> f.metodo() != Metodo.SEM_DADOS)
                .sorted(Comparator.comparing(ForecastResult::quantidadePrevista).reversed())
                .limit(LIMITE)
                .map(f -> new PrevisaoVenda(
                        f.productId(),
                        nomes.getOrDefault(f.productId(), "Produto " + f.productId()),
                        f.quantidadePrevista()))
                .toList();
    }
}
