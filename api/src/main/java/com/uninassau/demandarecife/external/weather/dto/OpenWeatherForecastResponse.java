package com.uninassau.demandarecife.external.weather.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenWeatherForecastResponse(
        String cod,
        Integer cnt,
        List<ForecastItem> list,
        CityInfo city
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ForecastItem(
            Long dt,
            MainInfo main,
            List<WeatherInfo> weather,
            RainInfo rain,
            @JsonProperty("dt_txt") String dtTxt
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MainInfo(
            BigDecimal temp,
            @JsonProperty("temp_min") BigDecimal tempMin,
            @JsonProperty("temp_max") BigDecimal tempMax,
            BigDecimal humidity
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WeatherInfo(
            Integer id,
            String main,
            String description
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RainInfo(
            @JsonProperty("3h") BigDecimal threeHours
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CityInfo(
            String name,
            String country
    ) {}
}
