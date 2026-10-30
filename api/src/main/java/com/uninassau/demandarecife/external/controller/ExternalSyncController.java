package com.uninassau.demandarecife.external.controller;

import com.uninassau.demandarecife.external.dto.SyncResultDto;
import com.uninassau.demandarecife.external.service.HolidaySyncService;
import com.uninassau.demandarecife.external.service.WeatherSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class ExternalSyncController {

    private final WeatherSyncService weatherSyncService;
    private final HolidaySyncService holidaySyncService;

    @PostMapping("/weather")
    public ResponseEntity<SyncResultDto> syncWeather(
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String estado
    ) {
        int total;
        if (cidade != null && !cidade.isBlank()) {
            total = weatherSyncService.syncWeatherForCity(cidade.trim(), estado != null ? estado.trim() : "PE");
        } else {
            total = weatherSyncService.syncWeatherForAllLocations();
        }

        return ResponseEntity.ok(SyncResultDto.success("Sincronização climática concluída com sucesso.", total));
    }

    @PostMapping("/holidays")
    public ResponseEntity<SyncResultDto> syncHolidays(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer anoInicio,
            @RequestParam(required = false) Integer anoFim
    ) {
        int total;
        if (anoInicio != null && anoFim != null) {
            total = holidaySyncService.syncHolidays(anoInicio, anoFim);
        } else if (ano != null) {
            total = holidaySyncService.syncHolidaysForYear(ano);
        } else {
            int currentYear = LocalDate.now().getYear();
            total = holidaySyncService.syncHolidays(currentYear - 1, currentYear + 1);
        }

        return ResponseEntity.ok(SyncResultDto.success("Sincronização de feriados concluída com sucesso.", total));
    }
}
