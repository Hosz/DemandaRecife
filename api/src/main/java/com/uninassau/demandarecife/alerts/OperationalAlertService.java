
package com.uninassau.demandarecife.alerts;

import com.uninassau.demandarecife.forecast.DemandForecastService;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.products.InventoryLevel;
import com.uninassau.demandarecife.products.InventoryLevelRepository;
import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OperationalAlertService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");

    private final OperationalAlertRepository repository;
    private final CurrentTenant currentTenant;
    private final InventoryLevelRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final DemandForecastService forecastService;

    public OperationalAlertService(
            OperationalAlertRepository repository,
            CurrentTenant currentTenant,
            InventoryLevelRepository inventoryRepository,
            ProductRepository productRepository,
            DemandForecastService forecastService) {
        this.repository = repository;
        this.currentTenant = currentTenant;
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.forecastService = forecastService;
    }

    @Transactional(readOnly = true)
    public List<OperationalAlert> listar() {
        return repository.findByTenantIdOrderByCriadoEmDesc(currentTenant.id());
    }

    @Transactional(readOnly = true)
    public List<OperationalAlert> listarPorStatus(String status) {
        if (status == null || status.isBlank()) {
            return listar();
        }

        return repository.findByTenantIdAndStatusOrderByCriadoEmDesc(
                currentTenant.id(), status.trim().toUpperCase());
    }

    @Transactional(readOnly = true)
    public long contarAtivos() {
        return repository.countByTenantIdAndStatus(currentTenant.id(), "ATIVO");
    }

    @Transactional(readOnly = true)
    public long contarNaoLidos() {
        return repository.findByTenantIdAndLidoEmIsNullOrderByCriadoEmDesc(
                currentTenant.id()).size();
    }

    @Transactional
    public boolean marcarComoLido(UUID alertaId) {
        return repository.marcarComoLido(
                alertaId, currentTenant.id(), LocalDateTime.now(ZONA)) > 0;
    }

    @Transactional
    public boolean resolver(UUID alertaId) {
        return repository.resolverAlerta(
                alertaId, currentTenant.id(), LocalDateTime.now(ZONA)) > 0;
    }

    @Transactional
    public int gerarAlertas() {
        UUID tenantId = currentTenant.id();

        List<InventoryLevel> estoques =
                inventoryRepository.findByTenantId(tenantId);

        Map<UUID, Product> produtos = new HashMap<>();
        for (Product produto : productRepository.findByTenantId(tenantId)) {
            produtos.put(produto.getId(), produto);
        }

        int gerados = 0;

        for (InventoryLevel estoque : estoques) {
            UUID productId = estoque.getProductId();
            Product produto = produtos.get(productId);

            if (produto == null) {
                continue;
            }

            int quantidade = estoque.getQuantidadeAtual() == null
                    ? 0 : estoque.getQuantidadeAtual();

            int minimo = estoque.getEstoqueMinimo() == null
                    ? 5 : estoque.getEstoqueMinimo();

            String tipo = null;
            String prioridade = null;
            String titulo = null;
            String descricao = null;

            if (quantidade <= 0) {
                tipo = "ESTOQUE_ZERADO";
                prioridade = "CRITICA";
                titulo = "Estoque zerado: " + produto.getNome();
                descricao = "O produto está sem unidades disponíveis.";
            } else if (quantidade <= minimo) {
                tipo = "ESTOQUE_BAIXO";
                prioridade = "ALTA";
                titulo = "Estoque baixo: " + produto.getNome();
                descricao = "Estoque atual: " + quantidade
                        + ". Estoque mínimo: " + minimo + ".";
            } else {
                int prazo = estoque.getTempoReposicaoDias() == null
                        ? 1 : Math.max(1, estoque.getTempoReposicaoDias());

                BigDecimal demandaPrevista = BigDecimal.ZERO;
                boolean possuiPrevisao = false;

                LocalDate hoje = LocalDate.now(ZONA);

                for (int dia = 1; dia <= prazo; dia++) {
                    LocalDate data = hoje.plusDays(dia);

                    List<ForecastResult> previsoes =
                            forecastService.forecast(tenantId, data);

                    for (ForecastResult previsao : previsoes) {
                        if (previsao.productId().equals(productId)
                                && previsao.metodo() != ForecastResult.Metodo.SEM_DADOS) {
                            demandaPrevista = demandaPrevista.add(
                                    previsao.quantidadePrevista());
                            possuiPrevisao = true;
                            break;
                        }
                    }
                }

                if (possuiPrevisao
                        && demandaPrevista.compareTo(
                                BigDecimal.valueOf(quantidade)) >= 0) {
                    tipo = "RISCO_DE_RUPTURA";
                    prioridade = "ALTA";
                    titulo = "Risco de falta: " + produto.getNome();
                    descricao = "A demanda prevista para os próximos "
                            + prazo + " dias é de "
                            + demandaPrevista + " unidades. Estoque atual: "
                            + quantidade + ".";
                }
            }

            if (tipo == null) {
                continue;
            }

            String chave = tipo + ":" + productId;

            boolean jaExiste = repository
                    .existsByTenantIdAndChaveDeduplicacaoAndStatus(
                            tenantId, chave, "ATIVO");

            if (jaExiste) {
                continue;
            }

            OperationalAlert alerta = new OperationalAlert();
            alerta.setTenantId(tenantId);
            alerta.setProductId(productId);
            alerta.setTipo(tipo);
            alerta.setTitulo(titulo);
            alerta.setDescricao(descricao);
            alerta.setPrioridade(prioridade);
            alerta.setStatus("ATIVO");
            alerta.setChaveDeduplicacao(chave);

            repository.save(alerta);
            gerados++;
        }

        return gerados;
    }
}
