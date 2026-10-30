package com.uninassau.demandarecife.external.support;

import com.uninassau.demandarecife.external.dto.OpenWeatherForecastResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;

@Slf4j
@Component
public class OpenWeatherClient {

    private final RestClient restClient;
    private final String apiKey;

    public OpenWeatherClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.weather.openweather.base-url:https://api.openweathermap.org}") String baseUrl,
            @Value("${app.weather.openweather.api-key:}") String apiKey
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    public Optional<OpenWeatherForecastResponse> fetch5DayForecast(String cidade, String estado) {
        if (apiKey == null || apiKey.isBlank() || "dummy".equalsIgnoreCase(apiKey)) {
            log.warn("OpenWeather API key não configurada. Pulei chamada para cidade={}", cidade);
            return Optional.empty();
        }

        String queryParam = (estado != null && !estado.isBlank())
                ? String.format("%s,%s,BR", cidade.trim(), estado.trim())
                : String.format("%s,BR", cidade.trim());

        try {
            OpenWeatherForecastResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/data/2.5/forecast")
                            .queryParam("q", queryParam)
                            .queryParam("units", "metric")
                            .queryParam("appid", apiKey)
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, resp) ->
                            log.error("Erro na API OpenWeather: status={} cidade={}", resp.getStatusCode(), cidade))
                    .body(OpenWeatherForecastResponse.class);

            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.error("Falha ao comunicar com OpenWeather para cidade='{}': {}", cidade, ex.getMessage());
            return Optional.empty();
        }
    }
}
