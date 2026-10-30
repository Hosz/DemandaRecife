package com.uninassau.demandarecife.external.holidays.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleCalendarEventsResponse(
        String summary,
        List<CalendarEventItem> items
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CalendarEventItem(
            String id,
            String summary,
            String description,
            DateInfo start,
            DateInfo end
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DateInfo(
            String date,
            String dateTime
    ) {}
}
