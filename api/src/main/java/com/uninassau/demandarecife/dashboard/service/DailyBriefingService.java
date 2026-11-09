package com.uninassau.demandarecife.dashboard.service;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.alerts.service.AlertService;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO;
import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO.PrevisaoVenda;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.forecast.service.DemandForecastService;
import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.replenishment.service.ReplenishmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");
    private static final int LIMITE = 10; // RNF03: listas sempre limitadas

    private final AlertService alertService;
    private final ReplenishmentService replenishmentService;
    private final DemandForecastService forecastService;
    private final ProductRepository productRepository;

    public DailyBriefingResponseDTO montar(UUID tenantId) {
        List<String> falhas = new ArrayList<>();

        List<AlertResponse> alertas = secao("alertas", falhas, () ->
                alertService.listar(tenantId, "ATIVO", false).stream().limit(LIMITE).toList());

        List<ReplenishmentSuggestion> compras = secao("compras", falhas, () ->
                replenishmentService.suggestions(tenantId).stream()
                        .filter(ReplenishmentSuggestion::comprarAgora)
                        .limit(LIMITE)
                        .toList());

        List<PrevisaoVenda> previsao = secao("previsaoVendas", falhas, () -> previsaoDoDia(tenantId));

        return new DailyBriefingResponseDTO(LocalDate.now(ZONA), alertas, compras, previsao, falhas);
    }

    /** Uma seção que falha volta vazia e é registrada em secoesComFalha (RNF03). */
    private <T> List<T> secao(String nome, List<String> falhas, Supplier<List<T>> fonte) {
        try {
            return fonte.get();
        } catch (Exception e) {
            log.error("Falha na seção '{}' do briefing diário", nome, e);
            falhas.add(nome);
            return List.of();
        }
    }

    private List<PrevisaoVenda> previsaoDoDia(UUID tenantId) {
        Map<UUID, String> nomes = productRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Product::getId, Product::getNome));

        return forecastService.forecast(tenantId, null).stream()
                .filter(f -> f.metodo() != Metodo.SEM_DADOS)
                .filter(f -> f.quantidadePrevista().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(ForecastResult::quantidadePrevista).reversed())
                .limit(LIMITE)
                .map(f -> new PrevisaoVenda(f.productId(),
                        nomes.getOrDefault(f.productId(), "Produto"), f.quantidadePrevista()))
                .toList();
    }
}