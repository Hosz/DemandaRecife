package com.uninassau.demandarecife.external.service;

import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse;
import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse.CalendarEventItem;
import com.uninassau.demandarecife.external.dto.GoogleCalendarEventsResponse.DateInfo;
import com.uninassau.demandarecife.external.entity.HolidayEvent;
import com.uninassau.demandarecife.external.repository.HolidayEventRepository;
import com.uninassau.demandarecife.external.support.GoogleCalendarClient;
import com.uninassau.demandarecife.external.support.HolidayProperties;
import com.uninassau.demandarecife.external.support.RegionalHolidaysProvider;
import com.uninassau.demandarecife.external.validator.ExternalSyncValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HolidaySyncServiceTest {

    @Mock
    private GoogleCalendarClient googleCalendarClient;

    @Mock
    private HolidayEventRepository holidayRepository;

    private RegionalHolidaysProvider regionalHolidaysProvider;
    private HolidaySyncService holidaySyncService;

    @BeforeEach
    void setUp() {
        regionalHolidaysProvider = new RegionalHolidaysProvider();
        HolidayProperties properties = new HolidayProperties("pt.brazilian#holiday@group.v.calendar.google.com");
        ExternalSyncValidator validator = new ExternalSyncValidator();

        holidaySyncService = new HolidaySyncService(
                googleCalendarClient,
                holidayRepository,
                regionalHolidaysProvider,
                properties,
                validator
        );
    }

    @Test
    void syncHolidaysForYear_processaEventosDoGoogleCalendarERegionais() {
        int year = 2026;
        CalendarEventItem item = new CalendarEventItem(
                "evt1",
                "Tiradentes",
                "Feriado nacional",
                new DateInfo("2026-04-21", null),
                new DateInfo("2026-04-22", null)
        );

        GoogleCalendarEventsResponse googleResp = new GoogleCalendarEventsResponse(
                "Feriados no Brasil", List.of(item)
        );

        when(googleCalendarClient.fetchEvents(anyString(), eq(LocalDate.of(2026, 1, 1)), eq(LocalDate.of(2026, 12, 31))))
                .thenReturn(Optional.of(googleResp));

        when(holidayRepository.existsExact(any(LocalDate.class), anyString(), any(), any()))
                .thenReturn(false);

        int count = holidaySyncService.syncHolidaysForYear(year);

        assertThat(count).isGreaterThan(1);
        verify(holidayRepository, atLeast(2)).save(any(HolidayEvent.class));
    }

    @Test
    void syncHolidaysForYear_naoDuplicaQuandoJaExisteNoBanco() {
        int year = 2026;
        CalendarEventItem item = new CalendarEventItem(
                "evt1",
                "Ano Novo",
                "Feriado",
                new DateInfo("2026-01-01", null),
                new DateInfo("2026-01-02", null)
        );

        GoogleCalendarEventsResponse googleResp = new GoogleCalendarEventsResponse("Feriados", List.of(item));

        when(googleCalendarClient.fetchEvents(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(googleResp));

        when(holidayRepository.existsExact(any(LocalDate.class), anyString(), any(), any()))
                .thenReturn(true);

        int count = holidaySyncService.syncHolidaysForYear(year);

        assertThat(count).isZero();
        verify(holidayRepository, never()).save(any(HolidayEvent.class));
    }

    @Test
    void syncHolidaysForYear_classificaTiposDeFeriadosCorretamente() {
        int year = 2026;
        CalendarEventItem item1 = new CalendarEventItem("1", "Carnaval", "Ponto facultativo", new DateInfo("2026-02-17", null), null);
        CalendarEventItem item2 = new CalendarEventItem("2", "Dia dos Pais", "Data comemorativa", new DateInfo("2026-08-09", null), null);

        GoogleCalendarEventsResponse googleResp = new GoogleCalendarEventsResponse("Feriados", List.of(item1, item2));

        when(googleCalendarClient.fetchEvents(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(googleResp));
        when(holidayRepository.existsExact(any(LocalDate.class), anyString(), any(), any()))
                .thenReturn(false);

        holidaySyncService.syncHolidaysForYear(year);

        ArgumentCaptor<HolidayEvent> captor = ArgumentCaptor.forClass(HolidayEvent.class);
        verify(holidayRepository, atLeast(2)).save(captor.capture());

        HolidayEvent carnavalEvent = captor.getAllValues().stream()
                .filter(e -> "Carnaval".equals(e.getNome()))
                .findFirst().orElseThrow();
        assertThat(carnavalEvent.getTipo()).isEqualTo("Ponto Facultativo");

        HolidayEvent diaDosPaisEvent = captor.getAllValues().stream()
                .filter(e -> "Dia dos Pais".equals(e.getNome()))
                .findFirst().orElseThrow();
        assertThat(diaDosPaisEvent.getTipo()).isEqualTo("Data Comemorativa");
    }
}
