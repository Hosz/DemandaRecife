package com.uninassau.demandarecife.external.repository;

import com.uninassau.demandarecife.external.entity.HolidayEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface HolidayEventRepository extends JpaRepository<HolidayEvent, UUID> {

    @Query("SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END FROM HolidayEvent h " +
           "WHERE h.dataEvento = :dataEvento " +
           "AND h.nome = :nome " +
           "AND ((:estado IS NULL AND h.estado IS NULL) OR h.estado = :estado) " +
           "AND ((:cidade IS NULL AND h.cidade IS NULL) OR h.cidade = :cidade)")
    boolean existsExact(
            @Param("dataEvento") LocalDate dataEvento,
            @Param("nome") String nome,
            @Param("estado") String estado,
            @Param("cidade") String cidade
    );

    List<HolidayEvent> findByDataEventoBetween(LocalDate inicio, LocalDate fim);

    @Query("SELECT h FROM HolidayEvent h WHERE h.dataEvento = :dataEvento " +
           "AND (h.estado IS NULL OR h.estado = :estado) " +
           "AND (h.cidade IS NULL OR h.cidade = :cidade)")
    List<HolidayEvent> findEventsForLocation(
            @Param("dataEvento") LocalDate dataEvento,
            @Param("estado") String estado,
            @Param("cidade") String cidade
    );
}
