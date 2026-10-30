package com.uninassau.demandarecife.external.weather;

import com.uninassau.demandarecife.external.weather.dto.OpenWeatherForecastResponse;
import com.uninassau.demandarecife.external.weather.dto.OpenWeatherForecastResponse.ForecastItem;
import com.uninassau.demandarecife.tenants.TenantRepository;
import com.uninassau.demandarecife.tenants.dto.LocationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeatherSyncService {

    private static final Logger log = LoggerFactory.getLogger(WeatherSyncService.class);
    private static final DateTimeFormatter DT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final OpenWeatherClient openWeatherClient;
    private final WeatherHistoryRepository weatherHistoryRepository;
    private final TenantRepository tenantRepository;
    private final String defaultCity;
    private final String defaultState;

    public WeatherSyncService(
            OpenWeatherClient openWeatherClient,
            WeatherHistoryRepository weatherHistoryRepository,
            TenantRepository tenantRepository,
            @Value("${app.weather.default-city:Recife}") String defaultCity,
            @Value("${app.weather.default-state:PE}") String defaultState
    ) {
        this.openWeatherClient = openWeatherClient;
        this.weatherHistoryRepository = weatherHistoryRepository;
        this.tenantRepository = tenantRepository;
        this.defaultCity = defaultCity;
        this.defaultState = defaultState;
    }

    @Transactional
    public int syncWeatherForAllLocations() {
        List<LocationDto> locations = tenantRepository.findDistinctLocations();

        if (locations.isEmpty()) {
            log.info("Nenhum tenant com cidade cadastrada encontrado. Utilizando localização padrão: {}, {}", defaultCity, defaultState);
            locations = List.of(new LocationDto(defaultCity, defaultState));
        }

        int totalSaved = 0;
        for (LocationDto loc : locations) {
            String cidade = (loc.cidade() != null && !loc.cidade().isBlank()) ? loc.cidade().trim() : defaultCity;
            String estado = (loc.estado() != null && !loc.estado().isBlank()) ? loc.estado().trim() : defaultState;

            totalSaved += syncWeatherForCity(cidade, estado);

            // Throttle de segurança para respeitar o rate-limit da OpenWeather (máx 60 req/min)
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
        log.info("Iniciando sincronização de clima para: {}, {}", cidade, estado);

        // 1. Consolidação do dia de ontem (se existir com status PREVISAO, fecha como CONSOLIDADO)
        consolidateYesterday(cidade);

        // 2. Busca previsão de 5 dias / 3 horas na OpenWeather
        Optional<OpenWeatherForecastResponse> responseOpt = openWeatherClient.fetch5DayForecast(cidade, estado);
        if (responseOpt.isEmpty() || responseOpt.get().list() == null || responseOpt.get().list().isEmpty()) {
            log.warn("Nenhum dado retornado da OpenWeather para {}, {}", cidade, estado);
            return 0;
        }

        // 3. Agrupa medições de 3h por data (LocalDate)
        Map<LocalDate, List<ForecastItem>> itemsByDate = groupItemsByDate(responseOpt.get().list());

        LocalDate today = LocalDate.now();
        int savedCount = 0;

        for (Map.Entry<LocalDate, List<ForecastItem>> entry : itemsByDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<ForecastItem> dayItems = entry.getValue();

            BigDecimal minTemp = calculateMinTemp(dayItems);
            BigDecimal maxTemp = calculateMaxTemp(dayItems);
            BigDecimal totalRain = calculateTotalRain(dayItems);
            String predominantCondition = findPredominantCondition(dayItems);

            // Upsert no banco
            WeatherHistory record = weatherHistoryRepository.findByCidadeAndDataClima(cidade, date)
                    .orElseGet(() -> {
                        WeatherHistory wh = new WeatherHistory();
                        wh.setCidade(cidade);
                        wh.setEstado(estado);
                        wh.setDataClima(date);
                        return wh;
                    });

            // Se for do passado, marca como CONSOLIDADO; se for hoje ou futuro, PREVISAO
            String status = date.isBefore(today) ? "CONSOLIDADO" : "PREVISAO";

            record.setTempMinima(minTemp);
            record.setTempMaxima(maxTemp);
            record.setPrecipitacaoMm(totalRain);
            record.setCondicao(predominantCondition);
            record.setStatus(status);
            record.setEstado(estado);

            weatherHistoryRepository.save(record);
            savedCount++;
        }

        log.info("Sincronização de clima finalizada para {}: {} registros salvos/atualizados", cidade, savedCount);
        return savedCount;
    }

    private void consolidateYesterday(String cidade) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        weatherHistoryRepository.findByCidadeAndDataClima(cidade, yesterday).ifPresent(record -> {
            if ("PREVISAO".equalsIgnoreCase(record.getStatus())) {
                record.setStatus("CONSOLIDADO");
                weatherHistoryRepository.save(record);
                log.info("Registro de clima de ontem consolidado para {}: {}", cidade, yesterday);
            }
        });
    }

    private Map<LocalDate, List<ForecastItem>> groupItemsByDate(List<ForecastItem> items) {
        Map<LocalDate, List<ForecastItem>> map = new LinkedHashMap<>();
        for (ForecastItem item : items) {
            LocalDate date = null;
            if (item.dtTxt() != null) {
                try {
                    date = LocalDateTime.parse(item.dtTxt(), DT_FORMATTER).toLocalDate();
                } catch (Exception ignored) {
                }
            }
            if (date != null) {
                map.computeIfAbsent(date, k -> new ArrayList<>()).add(item);
            }
        }
        return map;
    }

    private BigDecimal calculateMinTemp(List<ForecastItem> items) {
        return items.stream()
                .filter(i -> i.main() != null && i.main().tempMin() != null)
                .map(i -> i.main().tempMin())
                .min(BigDecimal::compareTo)
                .map(v -> v.setScale(2, RoundingMode.HALF_UP))
                .orElse(null);
    }

    private BigDecimal calculateMaxTemp(List<ForecastItem> items) {
        return items.stream()
                .filter(i -> i.main() != null && i.main().tempMax() != null)
                .map(i -> i.main().tempMax())
                .max(BigDecimal::compareTo)
                .map(v -> v.setScale(2, RoundingMode.HALF_UP))
                .orElse(null);
    }

    private BigDecimal calculateTotalRain(List<ForecastItem> items) {
        return items.stream()
                .filter(i -> i.rain() != null && i.rain().threeHours() != null)
                .map(i -> i.rain().threeHours())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String findPredominantCondition(List<ForecastItem> items) {
        // Se houver chuva em qualquer intervalo de 3h, priorizamos indicar "Rain"
        boolean hasRain = items.stream()
                .anyMatch(i -> i.weather() != null && i.weather().stream()
                        .anyMatch(w -> "Rain".equalsIgnoreCase(w.main()) || "Thunderstorm".equalsIgnoreCase(w.main()) || "Drizzle".equalsIgnoreCase(w.main())));

        if (hasRain) {
            return "Rain";
        }

        // Caso contrário, busca a condição mais frequente
        Map<String, Long> countMap = items.stream()
                .filter(i -> i.weather() != null && !i.weather().isEmpty())
                .map(i -> i.weather().getFirst().main())
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(w -> w, Collectors.counting()));

        return countMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Clear");
    }
}
