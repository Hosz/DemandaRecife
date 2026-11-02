package com.uninassau.demandarecife.external.mapper;

import com.uninassau.demandarecife.external.entity.WeatherHistory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class WeatherMapper {

    public static WeatherHistory toEntity(
            String cidade,
            String estado,
            LocalDate date,
            BigDecimal minTemp,
            BigDecimal maxTemp,
            BigDecimal totalRain,
            String condition,
            String status
    ) {
        return WeatherHistory.builder()
                .cidade(cidade)
                .estado(estado)
                .dataClima(date)
                .tempMinima(minTemp)
                .tempMaxima(maxTemp)
                .precipitacaoMm(totalRain)
                .condicao(condition)
                .status(status)
                .build();
    }

    public static WeatherHistory applyMeasurements(
            WeatherHistory record,
            String estado,
            BigDecimal minTemp,
            BigDecimal maxTemp,
            BigDecimal totalRain,
            String condition,
            String status
    ) {
        record.setEstado(estado);
        record.setTempMinima(minTemp);
        record.setTempMaxima(maxTemp);
        record.setPrecipitacaoMm(totalRain);
        record.setCondicao(condition);
        record.setStatus(status);
        return record;
    }
}
