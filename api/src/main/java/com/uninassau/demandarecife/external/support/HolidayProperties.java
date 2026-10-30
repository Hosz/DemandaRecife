package com.uninassau.demandarecife.external.support;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Getter
@Component
public class HolidayProperties {

    private final List<String> calendarIds;

    public HolidayProperties(
            @Value("${app.holidays.google.calendar-ids:pt.brazilian#holiday@group.v.calendar.google.com}") String calendarIdsConfig
    ) {
        this.calendarIds = Arrays.stream(calendarIdsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
