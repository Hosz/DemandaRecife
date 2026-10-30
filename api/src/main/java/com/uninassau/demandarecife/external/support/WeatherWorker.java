package com.uninassau.demandarecife.external.support;

import com.uninassau.demandarecife.external.service.WeatherSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherWorker {

    private static final int MAX_RETRIES = 3;

    private final WeatherSyncService weatherSyncService;

    @Scheduled(cron = "${app.weather.cron:0 0 2 * * ?}", zone = "America/Recife")
    public void executeDailyWeatherSync() {
        log.info("Iniciando Worker diário de sincronização climática (RF08)...");

        int attempt = 0;
        long backoffMs = 5000;

        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                int totalProcessed = weatherSyncService.syncWeatherForAllLocations();
                log.info("Worker de clima concluído com sucesso. Total de previsões/registros: {}", totalProcessed);
                return;
            } catch (Exception ex) {
                log.error("Tentativa {}/{} falhou ao sincronizar clima: {}", attempt, MAX_RETRIES, ex.getMessage(), ex);
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(backoffMs);
                        backoffMs *= 2;
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.warn("Worker de clima interrompido durante o backoff.");
                        return;
                    }
                }
            }
        }

        log.error("Worker de clima falhou após {} tentativas consecutivas.", MAX_RETRIES);
    }
}
