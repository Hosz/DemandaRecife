package com.uninassau.demandarecife.alerts;

import com.uninassau.demandarecife.inventory.InventoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockAlertJobTest {

    @Mock InventoryRepository inventoryRepository;
    @Mock StockAlertService stockAlertService;
    @InjectMocks StockAlertJob job;

    @Test
    void falhaEmUmNegocioNaoImpedeOsOutros() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        when(inventoryRepository.findTenantIdsWithInventory()).thenReturn(List.of(a, b));
        when(stockAlertService.avaliarEstoque(a)).thenThrow(new RuntimeException("erro"));
        when(stockAlertService.avaliarEstoque(b)).thenReturn(new StockAlertService.Resultado(0, 0));

        job.executar();

        verify(stockAlertService).avaliarEstoque(b);
    }
}