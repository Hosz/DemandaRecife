package com.uninassau.demandarecife.forecast.benchmark;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MarketBenchmarkRepository extends JpaRepository<MarketBenchmark, UUID> {

    List<MarketBenchmark> findByNicho(String nicho);

    List<MarketBenchmark> findByNichoAndDestaqueCatalogoTrue(String nicho);
}
