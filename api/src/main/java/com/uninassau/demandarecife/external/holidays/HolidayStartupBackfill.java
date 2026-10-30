package com.uninassau.demandarecife.external.holidays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class HolidayStartupBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(HolidayStartupBackfill.class);

    private final HolidayEventRepository holidayRepository;
    private final HolidaySyncService holidaySyncService;
    private final boolean backfillEnabled;

    public HolidayStartupBackfill(
            HolidayEventRepository holidayRepository,
            HolidaySyncService holidaySyncService,
            @Value("${app.holidays.backfill-enabled:true}") boolean backfillEnabled
    ) {
        this.holidayRepository = holidayRepository;
        this.holidaySyncService = holidaySyncService;
        this.backfillEnabled = backfillEnabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!backfillEnabled) {
            log.info("Carga inicial de feriados desabilitada por configuração.");
            return;
        }

        long count = holidayRepository.count();
        if (count == 0) {
            int currentYear = LocalDate.now().getYear();
            log.info("Banco sem feriados cadastrados (Cold Start detectado). Executando carga inicial para os anos {}, {} e {}...",
                    currentYear - 1, currentYear, currentYear + 1);

            try {
                int total = holidaySyncService.syncHolidays(currentYear - 1, currentYear + 1);
                log.info("Carga inicial de feriados concluída com sucesso: {} feriados/eventos inseridos.", total);
            } catch (Exception ex) {
                log.error("Erro ao realizar carga inicial de feriados no startup: {}", ex.getMessage(), ex);
            }
        } else {
            log.info("Feriados já presentes no banco (total: {}). Pulando carga inicial.", count);
        }
    }
}
