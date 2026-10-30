package com.uninassau.demandarecife.external.support;

import com.uninassau.demandarecife.external.service.HolidaySyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class HolidayWorker {

    private static final int MAX_RETRIES = 3;

    private final HolidaySyncService holidaySyncService;

    @Scheduled(cron = "${app.holidays.cron:0 30 2 * * ?}", zone = "America/Recife")
    public void executeDailyHolidaySync() {
        int currentYear = LocalDate.now().getYear();
        log.info("Iniciando Worker diário de sincronização de feriados para o ano {} (RF08)...", currentYear);

        int attempt = 0;
        long backoffMs = 5000;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                int totalProcessed = holidaySyncService.syncHolidaysForYear(currentYear);
                log.info("Worker de feriados concluído com sucesso. Total de novos feriados: {}", totalProcessed);
                return;
            } catch (Exception ex) {
                log.error("Tentativa {}/{} falhou ao sincronizar feriados: {}", attempt, MAX_RETRIES, ex.getMessage(), ex);
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(backoffMs);
                        backoffMs *= 2;
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.warn("Worker de feriados interrompido durante o backoff.");
                        return;
                    }
                }
            }
        }

        log.error("Worker de feriados falhou após {} tentativas consecutivas.", MAX_RETRIES);
    }
}
