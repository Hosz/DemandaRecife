package com.uninassau.demandarecife.forecast;

import com.uninassau.demandarecife.forecast.benchmark.BenchmarkProvider;
import com.uninassau.demandarecife.forecast.calc.MovingAverage;
import com.uninassau.demandarecife.forecast.calc.OperatingDays;
import com.uninassau.demandarecife.forecast.calc.WeekdaySeasonality;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DemandForecastService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");
    private static final int MIN_DIAS_HISTORICO = 7;      // abaixo disso: cold start
    private static final int MIN_DIAS_SAZONALIDADE = 14;  // precisa de pelo menos 2 semanas
    private static final int JANELA_MAX = 30;

    // Peso de cada média móvel: o recente conta mais
    private static final BigDecimal PESO_7 = new BigDecimal("0.5");
    private static final BigDecimal PESO_14 = new BigDecimal("0.3");
    private static final BigDecimal PESO_30 = new BigDecimal("0.2");

    private final ForecastRepository forecastRepository;
    private final ProductRepository productRepository;
    private final BenchmarkProvider benchmarkProvider;

    private record Ctx(String nicho, OperatingDays dias, LocalDate hoje, LocalDate alvo) {}

    /** Previsão de todos os produtos do tenant para a data (null = hoje). */
    @Transactional(readOnly = true)
    public List<ForecastResult> forecast(UUID tenantId, LocalDate dataAlvo) {
        LocalDate hoje = LocalDate.now(ZONA);
        return forecast(tenantId, dataAlvo != null ? dataAlvo : hoje, hoje);
    }

    // "hoje" como parâmetro: permite testar com datas fixas
    List<ForecastResult> forecast(UUID tenantId, LocalDate dataAlvo, LocalDate hoje) {
        var settings = forecastRepository.configuracoes(tenantId);
        var ctx = new Ctx(settings.nicho(), OperatingDays.parse(settings.diasFuncionamento()), hoje, dataAlvo);

        var vendas = forecastRepository.vendasPorDia(tenantId, hoje.minusDays(JANELA_MAX), hoje);
        var primeiras = forecastRepository.primeiraVenda(tenantId);

        return productRepository.findByTenantId(tenantId).stream()
                .map(p -> forecastProduct(p, ctx,
                        vendas.getOrDefault(p.getId(), Map.of()), primeiras.get(p.getId())))
                .toList();
    }

    private ForecastResult forecastProduct(Product p, Ctx ctx, Map<LocalDate, Integer> vendas, LocalDate primeiraVenda) {
        long diasHistorico = primeiraVenda == null ? 0 : ChronoUnit.DAYS.between(primeiraVenda, ctx.hoje());

        ForecastResult r = diasHistorico < MIN_DIAS_HISTORICO
                ? coldStart(p, ctx, vendas, primeiraVenda, diasHistorico)
                : fromHistory(p, ctx, vendas, primeiraVenda, diasHistorico);

        // Dia em que o negócio não abre: previsão zero, qualquer que seja o método
        return ctx.dias().isOpen(ctx.alvo())
                ? r
                : new ForecastResult(p.getId(), ctx.alvo(), BigDecimal.ZERO, r.metodo());
    }

    private ForecastResult fromHistory(Product p, Ctx ctx, Map<LocalDate, Integer> vendas,
                                       LocalDate primeiraVenda, long diasHistorico) {
        BigDecimal m7 = MovingAverage.calculate(vendas, primeiraVenda, ctx.hoje(), 7, ctx.dias());
        BigDecimal m14 = MovingAverage.calculate(vendas, primeiraVenda, ctx.hoje(), 14, ctx.dias());
        BigDecimal m30 = MovingAverage.calculate(vendas, primeiraVenda, ctx.hoje(), 30, ctx.dias());
        BigDecimal base = m7.multiply(PESO_7).add(m14.multiply(PESO_14)).add(m30.multiply(PESO_30));

        BigDecimal fator = BigDecimal.ONE;
        if (diasHistorico >= MIN_DIAS_SAZONALIDADE) {
            LocalDate limite = ctx.hoje().minusDays(JANELA_MAX);
            LocalDate inicio = primeiraVenda.isAfter(limite) ? primeiraVenda : limite;
            fator = WeekdaySeasonality.factors(vendas, inicio, ctx.hoje().minusDays(1), ctx.dias())
                    .get(ctx.alvo().getDayOfWeek());
        }
        return resultado(p, ctx, base.multiply(fator), Metodo.HISTORICO);
    }

    private ForecastResult coldStart(Product p, Ctx ctx, Map<LocalDate, Integer> vendas,
                                     LocalDate primeiraVenda, long diasHistorico) {
        Optional<BigDecimal> benchmark = benchmarkProvider.mediaDiaria(ctx.nicho(), p.getNome());
        if (benchmark.isPresent()) {
            return resultado(p, ctx, benchmark.get(), Metodo.BENCHMARK);
        }
        if (diasHistorico >= 1) {   // sem benchmark: melhor o pouco que existe do que zero
            BigDecimal media = MovingAverage.calculate(vendas, primeiraVenda, ctx.hoje(), 7, ctx.dias());
            return resultado(p, ctx, media, Metodo.HISTORICO);
        }
        return resultado(p, ctx, BigDecimal.ZERO, Metodo.SEM_DADOS);
    }

    private ForecastResult resultado(Product p, Ctx ctx, BigDecimal quantidade, Metodo metodo) {
        return new ForecastResult(p.getId(), ctx.alvo(), quantidade.setScale(2, RoundingMode.HALF_UP), metodo);
    }
}