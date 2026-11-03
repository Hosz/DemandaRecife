package com.uninassau.demandarecife.external.finder;

import com.uninassau.demandarecife.external.entity.HolidayEvent;
import com.uninassau.demandarecife.external.repository.HolidayEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class HolidayFinder {

    private final HolidayEventRepository holidayEventRepository;

    public boolean existsExact(LocalDate dataEvento, String nome, String estado, String cidade) {
        return holidayEventRepository.existsExact(dataEvento, nome, estado, cidade);
    }

    public List<HolidayEvent> findByPeriodo(LocalDate inicio, LocalDate fim) {
        return holidayEventRepository.findByDataEventoBetween(inicio, fim);
    }

    public List<HolidayEvent> findForLocation(LocalDate dataEvento, String estado, String cidade) {
        return holidayEventRepository.findEventsForLocation(dataEvento, estado, cidade);
    }
}
