package com.uninassau.demandarecife.forecast.benchmark;

import com.uninassau.demandarecife.shared.util.TextNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class DatabaseBenchmarkProvider implements BenchmarkProvider {

    private final MarketBenchmarkRepository benchmarkRepository;

    @Override
    public Optional<BigDecimal> mediaDiaria(String nicho, String nomeProduto) {
        if (nicho == null || nicho.isBlank() || nomeProduto == null || nomeProduto.isBlank()) {
            return Optional.empty();
        }

        String nichoNormalizado = normalizarNicho(nicho);
        String produtoNormalizado = TextNormalizer.normalize(nomeProduto);

        List<MarketBenchmark> benchmarks = benchmarkRepository.findByNicho(nichoNormalizado);
        if (benchmarks.isEmpty()) {
            return Optional.empty();
        }

        // Prioriza termos mais específicos (ex: "pao de queijo" antes de "pao")
        return benchmarks.stream()
                .sorted(Comparator.comparingInt((MarketBenchmark b) -> b.getTermoProduto().length()).reversed())
                .filter(b -> produtoNormalizado.contains(b.getTermoProduto()) || b.getTermoProduto().contains(produtoNormalizado))
                .findFirst()
                .map(MarketBenchmark::getMediaDiaria);
    }

    public static String normalizarNicho(String nicho) {
        if (nicho == null || nicho.isBlank()) return "geral";
        String n = TextNormalizer.normalize(nicho);

        // Alimentação & Gastronomia
        if (n.contains("hamburguer") || n.contains("pastel") || n.contains("lanchonete") || n.contains("lanche") || n.contains("sanduiche")) return "hamburgueria";
        if (n.contains("pizza")) return "pizzaria";
        if (n.contains("padaria") || n.contains("panificadora") || n.contains("panificacao")) return "padaria";
        if (n.contains("confeitaria") || n.contains("doceria") || n.contains("doce") || n.contains("bolo") || n.contains("cafe") || n.contains("cafeteria")) return "confeitaria";
        if (n.contains("boteco") || n.contains("espetinho") || n.contains("petisco") || n.contains("pub") || n.equals("bar") || n.contains(" bar") || n.startsWith("bar ")) return "bar";
        if (n.contains("restaurante") || n.contains("almoco") || n.contains("self") || n.contains("marmita")) return "restaurante";

        // Beleza & Estética
        if (n.contains("barbearia") || n.contains("barbeiro")) return "barbearia";
        if (n.contains("esmalteria") || n.contains("manicure") || n.contains("unha")) return "esmalteria";
        if (n.contains("estetica") || n.contains("sobrancelha") || n.contains("depilacao")) return "estetica";
        if (n.contains("salao") || n.contains("cabelo") || n.contains("cabeleireir")) return "salao";

        // Varejo
        if (n.contains("hortifruti") || n.contains("sacolao") || n.contains("frutaria") || n.contains("fruta") || n.contains("verdura")) return "hortifruti";
        if (n.contains("acougue") || n.contains("carne") || n.contains("frigorifico")) return "acougue";
        if (n.contains("mercado") || n.contains("mercearia") || n.contains("supermercado")) return "mercado";
        if (n.contains("roupa") || n.contains("vestuario") || n.contains("calcado") || n.contains("moda")) return "vestuario";

        // Automotivo
        if (n.contains("lava") || n.contains("car wash")) return "lavajato";
        if (n.contains("autopeca") || n.contains("motopeca") || n.contains("peca")) return "autopecas";
        if (n.contains("oficina") || n.contains("auto center") || n.contains("mecanica") || n.contains("mecanico")) return "oficina";

        // Fallbacks
        if (n.contains("aliment")) return "restaurante";
        if (n.contains("beleza")) return "salao";
        if (n.contains("auto")) return "oficina";

        return n;
    }
}
