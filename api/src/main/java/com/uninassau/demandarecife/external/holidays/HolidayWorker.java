package com.uninassau.demandarecife.external.holidays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class HolidayWorker {

    private static final Logger log = LoggerFactory.getLogger(HolidayWorker.class);
    private static final int MAX_RETRIES = 3;

    private final HolidaySyncService holidaySyncService;

    public HolidayWorker(HolidaySyncService holidaySyncService) {
        this.holidaySyncService = holidaySyncService;
    }

    @Scheduled(cron = "${app.holidays.cron:0 0 2 1 * ?}", zone = "America/Recife")
    public void executeScheduledHolidaySync() {
        log.info("Iniciando Worker agendado de sincronização de feriados (RF08)...");

        int currentYear = LocalDate.now().getYear();
        int attempt = 0;
        long backoffMs = 5000;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                int totalProcessed = holidaySyncService.syncHolidays(currentYear, currentYear + 1);
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
