package com.uninassau.demandarecife.external.support;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class WeatherProperties {

    private final String defaultCity;
    private final String defaultState;

    public WeatherProperties(
            @Value("${app.weather.default-city:Recife}") String defaultCity,
            @Value("${app.weather.default-state:PE}") String defaultState
    ) {
        this.defaultCity = defaultCity;
        this.defaultState = defaultState;
    }
}
