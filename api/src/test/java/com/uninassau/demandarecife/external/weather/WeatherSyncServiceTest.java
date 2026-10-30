package com.uninassau.demandarecife.external.weather;

import com.uninassau.demandarecife.external.weather.dto.OpenWeatherForecastResponse;
import com.uninassau.demandarecife.external.weather.dto.OpenWeatherForecastResponse.*;
import com.uninassau.demandarecife.tenants.TenantRepository;
import com.uninassau.demandarecife.tenants.dto.LocationDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeatherSyncServiceTest {

    @Mock
    private OpenWeatherClient openWeatherClient;

    @Mock
    private WeatherHistoryRepository weatherHistoryRepository;

    @Mock
    private TenantRepository tenantRepository;

    private WeatherSyncService weatherSyncService;

    @BeforeEach
    void setUp() {
        weatherSyncService = new WeatherSyncService(
                openWeatherClient,
                weatherHistoryRepository,
                tenantRepository,
                "Recife",
                "PE"
        );
    }

    @Test
    void syncWeatherForAllLocations_quandoNaoHaTenants_usaLocalizacaoPadrao() {
        when(tenantRepository.findDistinctLocations()).thenReturn(List.of());
        when(openWeatherClient.fetch5DayForecast("Recife", "PE")).thenReturn(Optional.empty());

        int count = weatherSyncService.syncWeatherForAllLocations();

        assertThat(count).isZero();
        verify(openWeatherClient).fetch5DayForecast("Recife", "PE");
    }

    @Test
    void syncWeatherForCity_consolidaPrevisaoDeOntem() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        WeatherHistory yesterdayRecord = new WeatherHistory();
        yesterdayRecord.setCidade("Recife");
        yesterdayRecord.setDataClima(yesterday);
        yesterdayRecord.setStatus("PREVISAO");

        when(weatherHistoryRepository.findByCidadeAndDataClima("Recife", yesterday))
                .thenReturn(Optional.of(yesterdayRecord));
        when(openWeatherClient.fetch5DayForecast("Recife", "PE"))
                .thenReturn(Optional.empty());

        weatherSyncService.syncWeatherForCity("Recife", "PE");

        assertThat(yesterdayRecord.getStatus()).isEqualTo("CONSOLIDADO");
        verify(weatherHistoryRepository).save(yesterdayRecord);
    }

    @Test
    void syncWeatherForCity_agregaPrevisaoDe3HorasESalva() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        String dtTxt1 = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 09:00:00";
        String dtTxt2 = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 12:00:00";

        ForecastItem item1 = new ForecastItem(
                1000L,
                new MainInfo(new BigDecimal("28.0"), new BigDecimal("25.0"), new BigDecimal("29.0"), new BigDecimal("70")),
                List.of(new WeatherInfo(800, "Clouds", "few clouds")),
                new RainInfo(null),
                dtTxt1
        );

        ForecastItem item2 = new ForecastItem(
                2000L,
                new MainInfo(new BigDecimal("30.0"), new BigDecimal("26.0"), new BigDecimal("32.0"), new BigDecimal("65")),
                List.of(new WeatherInfo(500, "Rain", "light rain")),
                new RainInfo(new BigDecimal("4.50")),
                dtTxt2
        );

        OpenWeatherForecastResponse response = new OpenWeatherForecastResponse(
                "200", 2, List.of(item1, item2), new CityInfo("Recife", "BR")
        );

        when(weatherHistoryRepository.findByCidadeAndDataClima("Recife", yesterday)).thenReturn(Optional.empty());
        when(openWeatherClient.fetch5DayForecast("Recife", "PE")).thenReturn(Optional.of(response));
        when(weatherHistoryRepository.findByCidadeAndDataClima("Recife", today)).thenReturn(Optional.empty());

        int saved = weatherSyncService.syncWeatherForCity("Recife", "PE");

        assertThat(saved).isEqualTo(1);

        ArgumentCaptor<WeatherHistory> captor = ArgumentCaptor.forClass(WeatherHistory.class);
        verify(weatherHistoryRepository).save(captor.capture());

        WeatherHistory savedEntity = captor.getValue();
        assertThat(savedEntity.getCidade()).isEqualTo("Recife");
        assertThat(savedEntity.getEstado()).isEqualTo("PE");
        assertThat(savedEntity.getDataClima()).isEqualTo(today);
        assertThat(savedEntity.getTempMinima()).isEqualByComparingTo("25.00");
        assertThat(savedEntity.getTempMaxima()).isEqualByComparingTo("32.00");
        assertThat(savedEntity.getPrecipitacaoMm()).isEqualByComparingTo("4.50");
        assertThat(savedEntity.getCondicao()).isEqualTo("Rain");
        assertThat(savedEntity.getStatus()).isEqualTo("PREVISAO");
    }
}
