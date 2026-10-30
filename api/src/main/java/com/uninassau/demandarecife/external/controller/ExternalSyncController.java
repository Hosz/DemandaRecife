package com.uninassau.demandarecife.external.controller;

import com.uninassau.demandarecife.external.controller.dto.SyncResultDto;
import com.uninassau.demandarecife.external.holidays.HolidaySyncService;
import com.uninassau.demandarecife.external.weather.WeatherSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sync")
public class ExternalSyncController {

    private final WeatherSyncService weatherSyncService;
    private final HolidaySyncService holidaySyncService;

    public ExternalSyncController(WeatherSyncService weatherSyncService, HolidaySyncService holidaySyncService) {
        this.weatherSyncService = weatherSyncService;
        this.holidaySyncService = holidaySyncService;
    }

    @PostMapping("/weather")
    public ResponseEntity<SyncResultDto> syncWeather(
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String estado
    ) {
        if (cidade != null && !cidade.isBlank()) {
            int count = weatherSyncService.syncWeatherForCity(cidade.trim(), estado != null ? estado.trim() : "PE");
            return ResponseEntity.ok(SyncResultDto.success("Clima sincronizado com sucesso para " + cidade, count));
        }

        int count = weatherSyncService.syncWeatherForAllLocations();
        return ResponseEntity.ok(SyncResultDto.success("Clima sincronizado para todas as localizações cadastradas", count));
    }

    @PostMapping("/holidays")
    public ResponseEntity<SyncResultDto> syncHolidays(
            @RequestParam(required = false) Integer ano
    ) {
        int targetYear = (ano != null && ano > 2000 && ano < 2100) ? ano : LocalDate.now().getYear();
        int count = holidaySyncService.syncHolidaysForYear(targetYear);
        return ResponseEntity.ok(SyncResultDto.success("Feriados sincronizados com sucesso para o ano " + targetYear, count));
    }
}
