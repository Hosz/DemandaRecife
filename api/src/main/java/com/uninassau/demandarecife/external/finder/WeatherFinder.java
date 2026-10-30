package com.uninassau.demandarecife.external.finder;

import com.uninassau.demandarecife.external.entity.WeatherHistory;
import com.uninassau.demandarecife.external.repository.WeatherHistoryRepository;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class WeatherFinder {

    private final WeatherHistoryRepository weatherHistoryRepository;

    public Optional<WeatherHistory> findByCidadeAndData(String cidade, LocalDate dataClima) {
        return weatherHistoryRepository.findByCidadeAndDataClima(cidade, dataClima);
    }

    public WeatherHistory findRequiredByCidadeAndData(String cidade, LocalDate dataClima) {
        return weatherHistoryRepository.findByCidadeAndDataClima(cidade, dataClima)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Histórico de clima não encontrado para cidade='%s' e data='%s'", cidade, dataClima)));
    }

    public List<WeatherHistory> findByCidadeAndPeriodo(String cidade, LocalDate inicio, LocalDate fim) {
        return weatherHistoryRepository.findByCidadeAndDataClimaBetween(cidade, inicio, fim);
    }
}
