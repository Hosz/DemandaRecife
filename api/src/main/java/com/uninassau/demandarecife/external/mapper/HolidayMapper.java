package com.uninassau.demandarecife.external.mapper;

import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse.CalendarEventItem;
import com.uninassau.demandarecife.external.entity.HolidayEvent;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class HolidayMapper {

    public static HolidayEvent toEntity(LocalDate date, String nome, String tipo, String estado, String cidade) {
        return HolidayEvent.builder()
                .dataEvento(date)
                .nome(nome)
                .tipo(tipo)
                .estado(estado)
                .cidade(cidade)
                .build();
    }

    public static LocalDate parseEventDate(CalendarEventItem item) {
        if (item == null || item.start() == null) {
            return null;
        }

        if (item.start().date() != null && !item.start().date().isBlank()) {
            return LocalDate.parse(item.start().date());
        }
        if (item.start().dateTime() != null && !item.start().dateTime().isBlank()) {
            return LocalDate.parse(item.start().dateTime().substring(0, 10), DateTimeFormatter.ISO_LOCAL_DATE);
        }
        return null;
    }

    public static String determineTipo(String description) {
        if (description == null) {
            return "Feriado Nacional";
        }
        String descLower = description.toLowerCase();
        if (descLower.contains("facultativo")) {
            return "Ponto Facultativo";
        }
        if (descLower.contains("comemorativ")) {
            return "Data Comemorativa";
        }
        return "Feriado Nacional";
    }
}
