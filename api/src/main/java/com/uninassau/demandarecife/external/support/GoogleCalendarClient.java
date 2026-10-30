package com.uninassau.demandarecife.external.support;

import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Component
public class GoogleCalendarClient {

    private final RestClient restClient;
    private final String apiKey;

    public GoogleCalendarClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.holidays.google.base-url:https://www.googleapis.com}") String baseUrl,
            @Value("${app.holidays.google.api-key:}") String apiKey
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    public Optional<GoogleCalendarEventsResponse> fetchEvents(String calendarId, LocalDate timeMin, LocalDate timeMax) {
        if (apiKey == null || apiKey.isBlank() || "dummy".equalsIgnoreCase(apiKey)) {
            log.warn("Google Calendar API key não configurada. Pulei consulta ao calendário: {}", calendarId);
            return Optional.empty();
        }

        try {
            String encodedCalendarId = URLEncoder.encode(calendarId, StandardCharsets.UTF_8);
            String timeMinStr = timeMin.atStartOfDay().toString() + "Z";
            String timeMaxStr = timeMax.atTime(23, 59, 59).toString() + "Z";

            GoogleCalendarEventsResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/calendar/v3/calendars/{calendarId}/events")
                            .queryParam("timeMin", timeMinStr)
                            .queryParam("timeMax", timeMaxStr)
                            .queryParam("singleEvents", true)
                            .queryParam("orderBy", "startTime")
                            .queryParam("key", apiKey)
                            .build(encodedCalendarId))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, resp) ->
                            log.error("Erro na API Google Calendar: status={} calendarId={}", resp.getStatusCode(), calendarId))
                    .body(GoogleCalendarEventsResponse.class);

            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.error("Falha ao buscar eventos no Google Calendar '{}': {}", calendarId, ex.getMessage());
            return Optional.empty();
        }
    }
}
