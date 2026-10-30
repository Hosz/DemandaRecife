package com.uninassau.demandarecife.forecast;

import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final DemandForecastService service;
    private final CurrentTenant currentTenant;

    // GET /api/forecast?data=2025-10-30  (sem "data" = hoje)
    @GetMapping
    public List<ForecastResult> forecast(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return service.forecast(currentTenant.id(), data);
    }
}