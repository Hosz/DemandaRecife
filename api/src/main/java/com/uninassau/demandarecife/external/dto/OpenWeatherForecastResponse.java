package com.uninassau.demandarecife.external.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public record OpenWeatherForecastResponse(
        String cod,
        Integer cnt,
        List<ForecastItem> list,
        CityInfo city
) {
    public record ForecastItem(
            Long dt,
            MainInfo main,
            List<WeatherInfo> weather,
            RainInfo rain,
            @JsonProperty("dt_txt") String dtTxt
    ) {}

    public record MainInfo(
            BigDecimal temp,
            @JsonProperty("temp_min") BigDecimal tempMin,
            @JsonProperty("temp_max") BigDecimal tempMax,
            BigDecimal humidity
    ) {}

    public record WeatherInfo(
            Integer id,
            String main,
            String description
    ) {}

    public record RainInfo(
            @JsonProperty("3h") BigDecimal threeHours
    ) {}

    public record CityInfo(
            String name,
            String country
    ) {}
}
