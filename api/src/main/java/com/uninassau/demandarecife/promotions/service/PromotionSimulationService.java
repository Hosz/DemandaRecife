package com.uninassau.demandarecife.promotions.service;

import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.promotions.dto.PromotionSimulation;
import com.uninassau.demandarecife.promotions.dto.PromotionSimulation.Status;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PromotionSimulationService {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PromotionSimulation simulate(UUID tenantId, UUID productId,
                                        BigDecimal discountPercentage, BigDecimal targetPrice) {
        if (discountPercentage != null && targetPrice != null) {
            throw new IllegalArgumentException("Informe discountPercentage ou targetPrice, não os dois.");
        }

        Product p = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

        BigDecimal preco = p.getPrecoVenda();
        BigDecimal custo = p.getCustoUnidade();
        if (preco == null || custo == null || preco.signum() <= 0) {
            throw new IllegalArgumentException("Produto sem custo ou preço de venda cadastrado.");
        }

        BigDecimal margemAtual = margem(preco, custo);
        // arredonda para baixo: o desconto mostrado nunca passa do ponto em que o preço iguala o custo
        BigDecimal descontoMax = custo.compareTo(preco) >= 0
                ? BigDecimal.ZERO.setScale(2)
                : preco.subtract(custo).multiply(CEM).divide(preco, 2, RoundingMode.DOWN);

        // sem parâmetros: só os limites
        if (discountPercentage == null && targetPrice == null) {
            return new PromotionSimulation(p.getId(), p.getNome(), dinheiro(custo), dinheiro(preco), margemAtual,
                    descontoMax, dinheiro(custo), null, null, null, null, null);
        }

        BigDecimal novoPreco;
        BigDecimal descontoAplicado;
        if (discountPercentage != null) {
            if (discountPercentage.signum() < 0 || discountPercentage.compareTo(CEM) >= 0) {
                throw new IllegalArgumentException("O desconto deve estar entre 0 e 99,99%.");
            }
            novoPreco = preco.multiply(CEM.subtract(discountPercentage)).divide(CEM, 2, RoundingMode.HALF_UP);
            descontoAplicado = discountPercentage.setScale(2, RoundingMode.HALF_UP);
        } else {
            if (targetPrice.signum() <= 0) {
                throw new IllegalArgumentException("O preço-alvo deve ser maior que zero.");
            }
            if (targetPrice.compareTo(preco) > 0) {
                throw new IllegalArgumentException("O preço-alvo deve ser menor ou igual ao preço atual.");
            }
            novoPreco = targetPrice.setScale(2, RoundingMode.HALF_UP);
            descontoAplicado = preco.subtract(novoPreco).multiply(CEM).divide(preco, 2, RoundingMode.HALF_UP);
        }
        if (novoPreco.signum() <= 0) {
            throw new IllegalArgumentException("Com esse desconto o preço fica zerado.");
        }

        // aprovado só se sobra lucro: preço igual ao custo (margem zero) já é risco
        Status status = novoPreco.compareTo(custo) > 0 ? Status.APROVADO : Status.RISCO_FINANCEIRO;

        return new PromotionSimulation(p.getId(), p.getNome(), dinheiro(custo), dinheiro(preco), margemAtual,
                descontoMax, dinheiro(custo), descontoAplicado, novoPreco, margem(novoPreco, custo),
                dinheiro(novoPreco.subtract(custo)), status);
    }

    /** (preço - custo) / preço, em %. */
    private static BigDecimal margem(BigDecimal preco, BigDecimal custo) {
        return preco.subtract(custo).multiply(CEM).divide(preco, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal dinheiro(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}