package com.uninassau.demandarecife.external.holidays;

import com.uninassau.demandarecife.external.holidays.dto.GoogleCalendarEventsResponse;
import com.uninassau.demandarecife.external.holidays.dto.GoogleCalendarEventsResponse.CalendarEventItem;
import com.uninassau.demandarecife.external.holidays.dto.GoogleCalendarEventsResponse.DateInfo;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
        holidaySyncService = new HolidaySyncService(
                googleCalendarClient,
                holidayRepository,
                regionalHolidaysProvider,
                "pt.brazilian#holiday@group.v.calendar.google.com"
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

        // Nenhum feriado pré-existente
        when(holidayRepository.existsExact(any(), any(), any(), any())).thenReturn(false);

        int totalSaved = holidaySyncService.syncHolidaysForYear(year);

        // 1 do Google + feriados regionais do catalog (PE/Recife/SP/RJ/BA/MG)
        assertThat(totalSaved).isGreaterThanOrEqualTo(2);
        verify(holidayRepository, atLeast(2)).save(any(HolidayEvent.class));
    }

    @Test
    void syncHolidaysForYear_quandoEventoJaExiste_naoDuplica() {
        int year = 2026;
        CalendarEventItem item = new CalendarEventItem(
                "evt1",
                "Independência do Brasil",
                "Feriado nacional",
                new DateInfo("2026-09-07", null),
                new DateInfo("2026-09-08", null)
        );

        GoogleCalendarEventsResponse googleResp = new GoogleCalendarEventsResponse(
                "Feriados no Brasil", List.of(item)
        );

        when(googleCalendarClient.fetchEvents(anyString(), any(), any()))
                .thenReturn(Optional.of(googleResp));

        // Todos já existem
        when(holidayRepository.existsExact(any(), any(), any(), any())).thenReturn(true);

        int totalSaved = holidaySyncService.syncHolidaysForYear(year);

        assertThat(totalSaved).isZero();
        verify(holidayRepository, never()).save(any());
    }

    @Test
    void syncHolidaysForYear_identificaPontoFacultativoPelaDescricao() {
        int year = 2026;
        CalendarEventItem item = new CalendarEventItem(
                "evt2",
                "Carnaval",
                "Ponto facultativo",
                new DateInfo("2026-02-17", null),
                new DateInfo("2026-02-18", null)
        );

        GoogleCalendarEventsResponse googleResp = new GoogleCalendarEventsResponse(
                "Feriados", List.of(item)
        );

        when(googleCalendarClient.fetchEvents(anyString(), any(), any()))
                .thenReturn(Optional.of(googleResp));

        when(holidayRepository.existsExact(eq(LocalDate.of(2026, 2, 17)), eq("Carnaval"), isNull(), isNull()))
                .thenReturn(false);

        holidaySyncService.syncHolidaysForYear(year);

        ArgumentCaptor<HolidayEvent> captor = ArgumentCaptor.forClass(HolidayEvent.class);
        verify(holidayRepository, atLeastOnce()).save(captor.capture());

        HolidayEvent carnavalEvent = captor.getAllValues().stream()
                .filter(e -> "Carnaval".equals(e.getNome()))
                .findFirst()
                .orElseThrow();

        assertThat(carnavalEvent.getTipo()).isEqualTo("Ponto Facultativo");
    }
}
