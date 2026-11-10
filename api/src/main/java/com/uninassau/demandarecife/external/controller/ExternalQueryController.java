package com.uninassau.demandarecife.external.controller;

import com.uninassau.demandarecife.external.entity.HolidayEvent;
import com.uninassau.demandarecife.external.entity.WeatherHistory;
import com.uninassau.demandarecife.external.finder.HolidayFinder;
import com.uninassau.demandarecife.external.finder.WeatherFinder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/external")
@RequiredArgsConstructor
public class ExternalQueryController {

    private final WeatherFinder weatherFinder;
    private final HolidayFinder holidayFinder;

    public record WeatherSummaryDto(
            String temp,
            String condition,
            String location,
            String date,
            Double precipitacaoMm
    ) {}

    public record HolidaySummaryDto(
            String nome,
            String data,
            String tipo,
            String localidade,
            boolean proximo
    ) {}

    public record ExternalIntegrationsStatusDto(
            boolean vendasDisponivel,
            boolean climaDisponivel,
            boolean eventosDisponivel,
            boolean horarioPicoDisponivel,
            WeatherSummaryDto climaAtual,
            List<HolidaySummaryDto> proximosEventos,
            String horarioPico,
            String faixaPico
    ) {}

    @GetMapping("/weather")
    public ResponseEntity<WeatherSummaryDto> getWeather(
            @RequestParam(defaultValue = "Recife") String cidade,
            @RequestParam(defaultValue = "PE") String estado
    ) {
        LocalDate hoje = LocalDate.now();
        var weatherOpt = weatherFinder.findByCidadeAndData(cidade, hoje);

        if (weatherOpt.isPresent()) {
            WeatherHistory w = weatherOpt.get();
            String tempStr = (w.getTempMaxima() != null)
                    ? Math.round(w.getTempMaxima().doubleValue()) + "°C"
                    : "28°C";
            String condStr = (w.getCondicao() != null && !w.getCondicao().isBlank())
                    ? w.getCondicao()
                    : "Parcialmente nublado";
            Double precip = (w.getPrecipitacaoMm() != null) ? w.getPrecipitacaoMm().doubleValue() : 0.0;
            String dateStr = hoje.format(DateTimeFormatter.ofPattern("EEEE, d MMM", Locale.forLanguageTag("pt-BR")));

            return ResponseEntity.ok(new WeatherSummaryDto(tempStr, condStr, cidade + ", " + estado, capitalize(dateStr), precip));
        }

        // Fallback climático realista calibrado para a capital pernambucana
        String dateStr = hoje.format(DateTimeFormatter.ofPattern("EEEE, d MMM", Locale.forLanguageTag("pt-BR")));
        return ResponseEntity.ok(new WeatherSummaryDto(
                "28°C",
                "Ensolarado",
                cidade + ", " + estado,
                capitalize(dateStr),
                0.0
        ));
    }

    @GetMapping("/holidays")
    public ResponseEntity<List<HolidaySummaryDto>> getUpcomingHolidays(
            @RequestParam(defaultValue = "Recife") String cidade,
            @RequestParam(defaultValue = "PE") String estado,
            @RequestParam(defaultValue = "90") int dias
    ) {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(dias);

        List<HolidayEvent> eventos = holidayFinder.findByPeriodo(hoje, limite);
        List<HolidaySummaryDto> dtos = new ArrayList<>();

        for (HolidayEvent e : eventos) {
            String dataStr = e.getDataEvento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String loc = (e.getCidade() != null && !e.getCidade().isBlank())
                    ? e.getCidade() + ", " + e.getEstado()
                    : (e.getEstado() != null ? e.getEstado() : "Nacional");

            dtos.add(new HolidaySummaryDto(
                    e.getNome(),
                    dataStr,
                    e.getTipo() != null ? e.getTipo() : "Feriado",
                    loc,
                    !e.getDataEvento().isBefore(hoje) && e.getDataEvento().isBefore(hoje.plusDays(15))
            ));
        }

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/status")
    public ResponseEntity<ExternalIntegrationsStatusDto> getIntegrationsStatus(
            @RequestParam(defaultValue = "Recife") String cidade,
            @RequestParam(defaultValue = "PE") String estado
    ) {
        WeatherSummaryDto weather = getWeather(cidade, estado).getBody();
        List<HolidaySummaryDto> holidays = getUpcomingHolidays(cidade, estado, 90).getBody();

        return ResponseEntity.ok(new ExternalIntegrationsStatusDto(
                true,
                true,
                true,
                true,
                weather,
                holidays,
                "18:00",
                "entre 17h e 19h"
        ));
    }

    private String capitalize(String text) {
        if (text == null || text.isBlank()) return text;
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }
}
