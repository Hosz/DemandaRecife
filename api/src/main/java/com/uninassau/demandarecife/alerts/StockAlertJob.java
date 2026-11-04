package com.uninassau.demandarecife.alerts;

import com.uninassau.demandarecife.inventory.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockAlertJob {

    private final InventoryRepository inventoryRepository;
    private final StockAlertService stockAlertService;

    // Padrão: de hora em hora. Configurável em app.alerts.stock-cron
    @Scheduled(cron = "${app.alerts.stock-cron:0 0 * * * *}", zone = "America/Recife")
    public void executar() {
        for (UUID tenantId : inventoryRepository.findTenantIdsWithInventory()) {
            try {
                var r = stockAlertService.avaliarEstoque(tenantId);
                log.info("Alertas de estoque do tenant {}: {} criados, {} resolvidos",
                        tenantId, r.criados(), r.resolvidos());
            } catch (Exception e) {
                log.error("Falha ao avaliar o estoque do tenant {}", tenantId, e);
            }
        }
    }
}