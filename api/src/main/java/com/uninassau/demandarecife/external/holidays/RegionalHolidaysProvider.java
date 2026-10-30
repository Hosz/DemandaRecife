package com.uninassau.demandarecife.external.holidays;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class RegionalHolidaysProvider {

    public record RegionalHolidayDef(
            int mes,
            int dia,
            String nome,
            String tipo,
            String estado,
            String cidade
    ) {}

    private final List<RegionalHolidayDef> catalog = new ArrayList<>();

    public RegionalHolidaysProvider() {
        initCatalog();
    }

    private void initCatalog() {
        // --- PERNAMBUCO & RECIFE ---
        catalog.add(new RegionalHolidayDef(3, 6, "Data Magna de Pernambuco", "Feriado Estadual", "PE", null));
        catalog.add(new RegionalHolidayDef(6, 24, "São João", "Feriado Estadual", "PE", null));
        catalog.add(new RegionalHolidayDef(7, 16, "Nossa Senhora do Carmo (Padroeira do Recife)", "Feriado Municipal", "PE", "Recife"));
        catalog.add(new RegionalHolidayDef(12, 8, "Nossa Senhora da Conceição", "Feriado Municipal", "PE", "Recife"));

        // --- SÃO PAULO & SÃO PAULO CAPITAL ---
        catalog.add(new RegionalHolidayDef(7, 9, "Revolução Constitucionalista", "Feriado Estadual", "SP", null));
        catalog.add(new RegionalHolidayDef(1, 25, "Aniversário de São Paulo", "Feriado Municipal", "SP", "São Paulo"));

        // --- RIO DE JANEIRO & CAPITAL ---
        catalog.add(new RegionalHolidayDef(4, 23, "Dia de São Jorge", "Feriado Estadual", "RJ", null));
        catalog.add(new RegionalHolidayDef(1, 20, "Dia de São Sebastião", "Feriado Municipal", "RJ", "Rio de Janeiro"));

        // --- BAHIA & SALVADOR ---
        catalog.add(new RegionalHolidayDef(7, 2, "Independência da Bahia", "Feriado Estadual", "BA", null));
        catalog.add(new RegionalHolidayDef(6, 24, "São João", "Feriado Estadual", "BA", null));
        catalog.add(new RegionalHolidayDef(12, 8, "Nossa Senhora da Conceição da Praia", "Feriado Municipal", "BA", "Salvador"));

        // --- MINAS GERAIS & BELO HORIZONTE ---
        catalog.add(new RegionalHolidayDef(8, 15, "Assunção de Nossa Senhora", "Feriado Municipal", "MG", "Belo Horizonte"));
        catalog.add(new RegionalHolidayDef(12, 8, "Imaculada Conceição", "Feriado Municipal", "MG", "Belo Horizonte"));
    }

    public List<HolidayEvent> getRegionalHolidaysForYear(int year) {
        List<HolidayEvent> events = new ArrayList<>();
        for (RegionalHolidayDef def : catalog) {
            try {
                LocalDate date = LocalDate.of(year, def.mes(), def.dia());
                events.add(new HolidayEvent(date, def.nome(), def.tipo(), def.estado(), def.cidade()));
            } catch (Exception ignored) {
            }
        }
        return events;
    }
}
