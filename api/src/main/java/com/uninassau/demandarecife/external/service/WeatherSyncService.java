package com.uninassau.demandarecife.external.service;

import com.uninassau.demandarecife.external.dto.OpenWeatherForecastResponse;
import com.uninassau.demandarecife.external.dto.OpenWeatherForecastResponse.ForecastItem;
import com.uninassau.demandarecife.external.entity.WeatherHistory;
import com.uninassau.demandarecife.external.enums.WeatherStatus;
import com.uninassau.demandarecife.external.mapper.WeatherMapper;
import com.uninassau.demandarecife.external.repository.WeatherHistoryRepository;
import com.uninassau.demandarecife.external.support.OpenWeatherClient;
import com.uninassau.demandarecife.external.support.WeatherAggregatorSupport;
import com.uninassau.demandarecife.external.support.WeatherProperties;
import com.uninassau.demandarecife.external.validator.ExternalSyncValidator;
import com.uninassau.demandarecife.tenants.TenantRepository;
import com.uninassau.demandarecife.tenants.dto.LocationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherSyncService {

    private final OpenWeatherClient openWeatherClient;
    private final WeatherHistoryRepository weatherHistoryRepository;
    private final TenantRepository tenantRepository;
    private final WeatherAggregatorSupport weatherAggregatorSupport;
    private final ExternalSyncValidator externalSyncValidator;
    private final WeatherProperties weatherProperties;

    @Transactional
    public int syncWeatherForAllLocations() {
        List<LocationDto> locations = tenantRepository.findDistinctLocations();

        if (locations.isEmpty()) {
            String defaultCity = weatherProperties.getDefaultCity();
            String defaultState = weatherProperties.getDefaultState();
            log.info("Nenhum tenant com cidade cadastrada encontrado. Utilizando localização padrão: {}, {}", defaultCity, defaultState);
            locations = List.of(new LocationDto(defaultCity, defaultState));
        }

        int totalSaved = 0;
        for (LocationDto loc : locations) {
            String cidade = (loc.cidade() != null && !loc.cidade().isBlank()) ? loc.cidade().trim() : weatherProperties.getDefaultCity();
            String estado = (loc.estado() != null && !loc.estado().isBlank()) ? loc.estado().trim() : weatherProperties.getDefaultState();

            totalSaved += syncWeatherForCity(cidade, estado);

            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        return totalSaved;
    }

    @Transactional
    public int syncWeatherForCity(String cidade, String estado) {
        externalSyncValidator.validateCity(cidade);
        log.info("Iniciando sincronização de clima para: {}, {}", cidade, estado);

        consolidateYesterday(cidade);

        Optional<OpenWeatherForecastResponse> responseOpt = openWeatherClient.fetch5DayForecast(cidade, estado);
        if (responseOpt.isEmpty() || responseOpt.get().list() == null || responseOpt.get().list().isEmpty()) {
            log.warn("Nenhum dado retornado da OpenWeather para {}, {}", cidade, estado);
            return 0;
        }

        Map<LocalDate, List<ForecastItem>> itemsByDate = weatherAggregatorSupport.groupItemsByDate(responseOpt.get().list());
        LocalDate today = LocalDate.now();
        int savedCount = 0;

        for (Map.Entry<LocalDate, List<ForecastItem>> entry : itemsByDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<ForecastItem> dayItems = entry.getValue();

            BigDecimal minTemp = weatherAggregatorSupport.calculateMinTemp(dayItems);
            BigDecimal maxTemp = weatherAggregatorSupport.calculateMaxTemp(dayItems);
            BigDecimal totalRain = weatherAggregatorSupport.calculateTotalRain(dayItems);
            String predominantCondition = weatherAggregatorSupport.findPredominantCondition(dayItems);

            String status = date.isBefore(today) ? WeatherStatus.CONSOLIDADO.name() : WeatherStatus.PREVISAO.name();

            WeatherHistory record = weatherHistoryRepository.findByCidadeAndDataClima(cidade, date)
                    .map(existing -> WeatherMapper.applyMeasurements(existing, estado, minTemp, maxTemp, totalRain, predominantCondition, status))
                    .orElseGet(() -> WeatherMapper.toEntity(cidade, estado, date, minTemp, maxTemp, totalRain, predominantCondition, status));

            weatherHistoryRepository.save(record);
            savedCount++;
        }

        log.info("Sincronização de clima finalizada para {}: {} registros salvos/atualizados", cidade, savedCount);
        return savedCount;
    }

    private void consolidateYesterday(String cidade) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        weatherHistoryRepository.findByCidadeAndDataClima(cidade, yesterday).ifPresent(record -> {
            if (WeatherStatus.PREVISAO.name().equalsIgnoreCase(record.getStatus())) {
                record.setStatus(WeatherStatus.CONSOLIDADO.name());
                weatherHistoryRepository.save(record);
                log.info("Registro de clima de ontem consolidado para {}: {}", cidade, yesterday);
            }
        });
    }
}
