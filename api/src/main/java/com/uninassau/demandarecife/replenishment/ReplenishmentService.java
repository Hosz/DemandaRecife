package com.uninassau.demandarecife.replenishment;

import com.uninassau.demandarecife.forecast.DemandForecastService;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.inventory.InventoryLevel;
import com.uninassau.demandarecife.inventory.InventoryRepository;
import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ReplenishmentService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");

    private static final int DIAS_COBERTURA = 7;                          // quantos dias de venda cabem no estoque máximo
    private static final BigDecimal MARGEM_SEGURANCA = new BigDecimal("0.25");
    private static final int FATOR_MAXIMO_PADRAO = 2;                     // sem histórico: máximo = 2x o mínimo

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final DemandForecastService forecastService;

    @Transactional(readOnly = true)
    public List<ReplenishmentSuggestion> suggestions(UUID tenantId) {
        List<InventoryLevel> niveis = inventoryRepository.findByTenantId(tenantId);
        if (niveis.isEmpty()) return List.of();

        Map<UUID, String> nomes = productRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Product::getId, Product::getNome));

        int horizonteMax = niveis.stream().mapToInt(n -> prazo(n) + DIAS_COBERTURA).max().orElse(DIAS_COBERTURA);
        var previsoes = forecastService.forecastPeriod(tenantId, LocalDate.now(ZONA), horizonteMax);

        return niveis.stream()
                .map(n -> calcular(n,
                        nomes.getOrDefault(n.getProductId(), "Produto"),
                        previsoes.getOrDefault(n.getProductId(), List.of())))
                .toList();
    }

    private ReplenishmentSuggestion calcular(InventoryLevel n, String produto, List<ForecastResult> previsao) {
        int prazo = prazo(n);
        int horizonte = prazo + DIAS_COBERTURA;
        List<ForecastResult> janela = previsao.stream().limit(horizonte).toList();

        boolean semDados = janela.isEmpty()
                || janela.stream().allMatch(f -> f.metodo() == Metodo.SEM_DADOS);

        int minimo;
        int maximo;
        ReplenishmentSuggestion.Metodo metodo;

        if (semDados) {
            // Produto novo: usa o mínimo cadastrado (padrão 5) em vez de inventar um número
            minimo = n.getEstoqueMinimo();
            maximo = Math.max(minimo * FATOR_MAXIMO_PADRAO, minimo + 1);
            metodo = ReplenishmentSuggestion.Metodo.PADRAO;
        } else {
            BigDecimal demandaPrazo = somar(janela.stream().limit(prazo));
            BigDecimal demandaTotal = somar(janela.stream());
            BigDecimal mediaDiaria = demandaTotal.divide(BigDecimal.valueOf(horizonte), 4, RoundingMode.HALF_UP);

            // margem: 25% da demanda do prazo, nunca menos que 1 dia de venda
            BigDecimal margem = demandaPrazo.multiply(MARGEM_SEGURANCA).max(mediaDiaria);

            // o mínimo cadastrado funciona como piso
            minimo = Math.max(teto(demandaPrazo.add(margem)), n.getEstoqueMinimo());
            maximo = Math.max(teto(demandaTotal), minimo + 1);
            metodo = ReplenishmentSuggestion.Metodo.PREVISAO;
        }

        boolean comprarAgora = n.getQuantidadeAtual() <= minimo;
        int quantidade = comprarAgora ? maximo - n.getQuantidadeAtual() : 0;

        return new ReplenishmentSuggestion(n.getProductId(), produto, n.getQuantidadeAtual(),
                minimo, maximo, comprarAgora, quantidade, metodo);
    }

    private static int prazo(InventoryLevel n) {
        return Math.max(1, n.getTempoReposicaoDias());
    }

    private static BigDecimal somar(Stream<ForecastResult> previsoes) {
        return previsoes.map(ForecastResult::quantidadePrevista).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static int teto(BigDecimal valor) {
        return valor.setScale(0, RoundingMode.CEILING).intValue();
    }
}