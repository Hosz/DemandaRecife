package com.uninassau.demandarecife.external.service;

import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse;
import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse.CalendarEventItem;
import com.uninassau.demandarecife.external.entity.HolidayEvent;
import com.uninassau.demandarecife.external.mapper.HolidayMapper;
import com.uninassau.demandarecife.external.repository.HolidayEventRepository;
import com.uninassau.demandarecife.external.support.GoogleCalendarClient;
import com.uninassau.demandarecife.external.support.HolidayProperties;
import com.uninassau.demandarecife.external.support.RegionalHolidaysProvider;
import com.uninassau.demandarecife.external.validator.ExternalSyncValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class HolidaySyncService {

    private final GoogleCalendarClient googleCalendarClient;
    private final HolidayEventRepository holidayRepository;
    private final RegionalHolidaysProvider regionalHolidaysProvider;
    private final HolidayProperties holidayProperties;
    private final ExternalSyncValidator externalSyncValidator;

    @Transactional
    public int syncHolidays(int startYear, int endYear) {
        externalSyncValidator.validateYearRange(startYear, endYear);
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
        for (String calId : holidayProperties.getCalendarIds()) {
            Optional<GoogleCalendarEventsResponse> responseOpt = googleCalendarClient.fetchEvents(calId, startOfYear, endOfYear);
            if (responseOpt.isPresent() && responseOpt.get().items() != null) {
                for (CalendarEventItem item : responseOpt.get().items()) {
                    LocalDate eventDate = HolidayMapper.parseEventDate(item);
                    if (eventDate == null || item.summary() == null || item.summary().isBlank()) {
                        continue;
                    }

                    String nome = item.summary().trim();
                    String tipo = HolidayMapper.determineTipo(item.description());

                    boolean exists = holidayRepository.existsExact(eventDate, nome, null, null);
                    if (!exists) {
                        HolidayEvent event = HolidayMapper.toEntity(eventDate, nome, tipo, null, null);
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
}
