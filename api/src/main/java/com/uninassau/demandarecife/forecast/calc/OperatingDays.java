package com.uninassau.demandarecife.forecast.calc;

import com.uninassau.demandarecife.shared.util.TextNormalizer;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static java.util.Map.entry;

public final class OperatingDays {

    private static final Map<String, DayOfWeek> PREFIXOS = Map.ofEntries(
            entry("seg", DayOfWeek.MONDAY), entry("mon", DayOfWeek.MONDAY),
            entry("ter", DayOfWeek.TUESDAY), entry("tue", DayOfWeek.TUESDAY),
            entry("qua", DayOfWeek.WEDNESDAY), entry("wed", DayOfWeek.WEDNESDAY),
            entry("qui", DayOfWeek.THURSDAY), entry("thu", DayOfWeek.THURSDAY),
            entry("sex", DayOfWeek.FRIDAY), entry("fri", DayOfWeek.FRIDAY),
            entry("sab", DayOfWeek.SATURDAY), entry("sat", DayOfWeek.SATURDAY),
            entry("dom", DayOfWeek.SUNDAY), entry("sun", DayOfWeek.SUNDAY)
    );

    private final Set<DayOfWeek> dias;   // vazio = abre todos os dias

    private OperatingDays(Set<DayOfWeek> dias) {
        this.dias = dias;
    }

    public static OperatingDays todosOsDias() {
        return new OperatingDays(EnumSet.noneOf(DayOfWeek.class));
    }

    /** Aceita "SEG,TER", "Segunda; Terça", "seg ter qua"... Sem nada reconhecido: abre todos os dias. */
    public static OperatingDays parse(String texto) {
        Set<DayOfWeek> encontrados = EnumSet.noneOf(DayOfWeek.class);
        for (String token : TextNormalizer.normalize(texto).split("[^a-z0-9]+")) {
            if (token.length() >= 3) {
                DayOfWeek dia = PREFIXOS.get(token.substring(0, 3));
                if (dia != null) encontrados.add(dia);
            }
        }
        return new OperatingDays(encontrados);
    }

    public boolean isOpen(LocalDate data) {
        return dias.isEmpty() || dias.contains(data.getDayOfWeek());
    }
}