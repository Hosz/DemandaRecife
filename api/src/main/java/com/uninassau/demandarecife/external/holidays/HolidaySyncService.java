package com.uninassau.demandarecife.external.holidays;

import com.uninassau.demandarecife.external.holidays.dto.GoogleCalendarEventsResponse;
import com.uninassau.demandarecife.external.holidays.dto.GoogleCalendarEventsResponse.CalendarEventItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class HolidaySyncService {

    private static final Logger log = LoggerFactory.getLogger(HolidaySyncService.class);

    private final GoogleCalendarClient googleCalendarClient;
    private final HolidayEventRepository holidayRepository;
    private final RegionalHolidaysProvider regionalHolidaysProvider;
    private final List<String> calendarIds;

    public HolidaySyncService(
            GoogleCalendarClient googleCalendarClient,
            HolidayEventRepository holidayRepository,
            RegionalHolidaysProvider regionalHolidaysProvider,
            @Value("${app.holidays.google.calendar-ids:pt.brazilian#holiday@group.v.calendar.google.com}") String calendarIdsConfig
    ) {
        this.googleCalendarClient = googleCalendarClient;
        this.holidayRepository = holidayRepository;
        this.regionalHolidaysProvider = regionalHolidaysProvider;
        this.calendarIds = Arrays.stream(calendarIdsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    @Transactional
    public int syncHolidays(int startYear, int endYear) {
        log.info("Iniciando sincronização de feriados entre os anos {} e {}...", startYear, endYear);
        int totalSaved = 0;

        for (int year = startYear; year <= endYear; year++) {
            totalSaved += syncHolidaysForYear(year);
        }

        log.info("Sincronização de feriados concluída. Total de novos eventos salvos: {}", totalSaved);
        return totalSaved;
    }

    @Transactional
    public int syncHolidaysForYear(int year) {
        LocalDate startOfYear = LocalDate.of(year, 1, 1);
        LocalDate endOfYear = LocalDate.of(year, 12, 31);
        int savedCount = 0;

        // 1. Google Calendar (Nacionais / Calendários Configurados)
        for (String calId : calendarIds) {
            Optional<GoogleCalendarEventsResponse> responseOpt = googleCalendarClient.fetchEvents(calId, startOfYear, endOfYear);
            if (responseOpt.isPresent() && responseOpt.get().items() != null) {
                for (CalendarEventItem item : responseOpt.get().items()) {
                    LocalDate eventDate = parseEventDate(item);
                    if (eventDate == null || item.summary() == null || item.summary().isBlank()) {
                        continue;
                    }

                    String nome = item.summary().trim();
                    String tipo = determineTipo(item.description());

                    // Feriados do Google Calendar nacional têm estado=null e cidade=null
                    boolean exists = holidayRepository.existsExact(eventDate, nome, null, null);
                    if (!exists) {
                        HolidayEvent event = new HolidayEvent(eventDate, nome, tipo, null, null);
                        holidayRepository.save(event);
                        savedCount++;
                    }
                }
            }
        }

        // 2. Feriados Regionais / Estaduais / Municipais (Recife, PE, SP, RJ, BA, MG)
        List<HolidayEvent> regionalEvents = regionalHolidaysProvider.getRegionalHolidaysForYear(year);
        for (HolidayEvent regEvent : regionalEvents) {
            boolean exists = holidayRepository.existsExact(
                    regEvent.getDataEvento(),
                    regEvent.getNome(),
                    regEvent.getEstado(),
                    regEvent.getCidade()
            );

            if (!exists) {
                holidayRepository.save(regEvent);
                savedCount++;
            }
        }

        return savedCount;
    }

    private LocalDate parseEventDate(CalendarEventItem item) {
        if (item.start() == null) return null;

        if (item.start().date() != null && !item.start().date().isBlank()) {
            return LocalDate.parse(item.start().date());
        }
        if (item.start().dateTime() != null && !item.start().dateTime().isBlank()) {
            return LocalDate.parse(item.start().dateTime().substring(0, 10), DateTimeFormatter.ISO_LOCAL_DATE);
        }
        return null;
    }

    private String determineTipo(String description) {
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
