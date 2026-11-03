package com.uninassau.demandarecife.external.support;

import com.uninassau.demandarecife.external.dto.OpenWeatherForecastResponse.ForecastItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class WeatherAggregatorSupport {

    private static final DateTimeFormatter DT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Map<LocalDate, List<ForecastItem>> groupItemsByDate(List<ForecastItem> items) {
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

    public BigDecimal calculateMinTemp(List<ForecastItem> items) {
        BigDecimal min = null;
        for (ForecastItem item : items) {
            if (item.main() != null && item.main().tempMin() != null) {
                BigDecimal temp = item.main().tempMin();
                if (min == null || temp.compareTo(min) < 0) {
                    min = temp;
                }
            }
        }
        return min != null ? min.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public BigDecimal calculateMaxTemp(List<ForecastItem> items) {
        BigDecimal max = null;
        for (ForecastItem item : items) {
            if (item.main() != null && item.main().tempMax() != null) {
                BigDecimal temp = item.main().tempMax();
                if (max == null || temp.compareTo(max) > 0) {
                    max = temp;
                }
            }
        }
        return max != null ? max.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public BigDecimal calculateTotalRain(List<ForecastItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (ForecastItem item : items) {
            if (item.rain() != null && item.rain().threeHours() != null) {
                total = total.add(item.rain().threeHours());
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    public String findPredominantCondition(List<ForecastItem> items) {
        List<String> conditions = items.stream()
                .filter(i -> i.weather() != null && !i.weather().isEmpty())
                .map(i -> i.weather().getFirst().main())
                .filter(m -> m != null && !m.isBlank())
                .toList();

        if (conditions.isEmpty()) {
            return "Clear";
        }

        return conditions.stream()
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Clear");
    }
}
