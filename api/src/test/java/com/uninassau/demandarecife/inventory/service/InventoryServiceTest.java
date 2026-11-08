package com.uninassau.demandarecife.inventory.service;

import com.uninassau.demandarecife.inventory.entity.InventoryLevel;
import com.uninassau.demandarecife.inventory.repository.InventoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final LocalDateTime CONTAGEM = LocalDateTime.of(2025, 10, 20, 8, 0);

    @Mock
    InventoryRepository repository;
    @InjectMocks
    InventoryService service;

    private InventoryLevel nivel(UUID productId) {
        var n = new InventoryLevel();
        n.setTenantId(TENANT);
        n.setProductId(productId);
        n.setContadoEm(CONTAGEM);
        return n;
    }

    @Test
    void contagensMapeiaProdutoParaADataDaContagem() {
        UUID produto = UUID.randomUUID();
        when(repository.findByTenantId(TENANT)).thenReturn(List.of(nivel(produto)));

        assertThat(service.contagens(TENANT)).containsEntry(produto, CONTAGEM);
    }

    @Test
    void vendaDepoisDaContagemBaixaOEstoque() {
        UUID produto = UUID.randomUUID();
        when(repository.findByTenantIdAndProductId(TENANT, produto)).thenReturn(Optional.of(nivel(produto)));

        service.baixarVendaAvulsa(TENANT, produto, 3, CONTAGEM.plusHours(1));

        verify(repository).baixar(TENANT, produto, 3);
    }

    @Test
    void vendaAntesDaContagemNaoBaixa() {
        UUID produto = UUID.randomUUID();
        when(repository.findByTenantIdAndProductId(TENANT, produto)).thenReturn(Optional.of(nivel(produto)));

        service.baixarVendaAvulsa(TENANT, produto, 3, CONTAGEM.minusDays(5));

        verify(repository, never()).baixar(TENANT, produto, 3);
    }

    @Test
    void produtoSemRegistroDeEstoqueNaoFazNada() {
        UUID produto = UUID.randomUUID();
        when(repository.findByTenantIdAndProductId(TENANT, produto)).thenReturn(Optional.empty());

        service.baixarVendaAvulsa(TENANT, produto, 3, CONTAGEM.plusHours(1));

        verify(repository, never()).baixar(eq(TENANT), eq(produto), anyInt());
    }

    @Test
    void baixaEmLoteFazUmaBaixaPorProduto() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();

        service.baixar(TENANT, Map.of(a, 60, b, 5));

        verify(repository).baixar(TENANT, a, 60);
        verify(repository).baixar(TENANT, b, 5);
    }
}