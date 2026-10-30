package com.uninassau.demandarecife.external.weather;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeatherHistoryRepository extends JpaRepository<WeatherHistory, UUID> {

    Optional<WeatherHistory> findByCidadeAndDataClima(String cidade, LocalDate dataClima);

    List<WeatherHistory> findByCidadeAndDataClimaBetween(String cidade, LocalDate dataInicio, LocalDate dataFim);
}
