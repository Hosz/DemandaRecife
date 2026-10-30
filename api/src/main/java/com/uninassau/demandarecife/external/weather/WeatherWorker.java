package com.uninassau.demandarecife.external.weather;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WeatherWorker {

    private static final Logger log = LoggerFactory.getLogger(WeatherWorker.class);
    private static final int MAX_RETRIES = 3;

    private final WeatherSyncService weatherSyncService;

    public WeatherWorker(WeatherSyncService weatherSyncService) {
        this.weatherSyncService = weatherSyncService;
    }

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
                        backoffMs *= 2; // Backoff exponencial
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
