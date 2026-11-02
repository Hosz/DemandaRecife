package com.uninassau.demandarecife.external.controller;

import com.uninassau.demandarecife.external.service.HolidaySyncService;
import com.uninassau.demandarecife.external.service.WeatherSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ExternalSyncControllerTest {

    @Mock
    private WeatherSyncService weatherSyncService;

    @Mock
    private HolidaySyncService holidaySyncService;

    @InjectMocks
    private ExternalSyncController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void syncWeather_semParametros_sincronizaTodasAsLocalizacoes() throws Exception {
        when(weatherSyncService.syncWeatherForAllLocations()).thenReturn(10);

        mockMvc.perform(post("/api/v1/sync/weather"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.totalProcessed").value(10));

        verify(weatherSyncService).syncWeatherForAllLocations();
    }

    @Test
    void syncWeather_comCidadeEEstado_sincronizaEspecifico() throws Exception {
        when(weatherSyncService.syncWeatherForCity(eq("Olinda"), eq("PE"))).thenReturn(5);

        mockMvc.perform(post("/api/v1/sync/weather?cidade=Olinda&estado=PE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.totalProcessed").value(5));

        verify(weatherSyncService).syncWeatherForCity("Olinda", "PE");
    }

    @Test
    void syncHolidays_comAno_sincronizaAnoEspecifico() throws Exception {
        when(holidaySyncService.syncHolidaysForYear(2026)).thenReturn(18);

        mockMvc.perform(post("/api/v1/sync/holidays?ano=2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.totalProcessed").value(18));

        verify(holidaySyncService).syncHolidaysForYear(2026);
    }
}
