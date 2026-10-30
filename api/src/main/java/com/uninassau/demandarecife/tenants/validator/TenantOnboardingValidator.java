package com.uninassau.demandarecife.tenants.validator;

import com.uninassau.demandarecife.shared.exception.BadRequestException;
import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Component
public class TenantOnboardingValidator {

    public void validateOnboarding(OnboardingRequestDto request) {
        if (request == null) {
            throw new BadRequestException("A requisição de onboarding não pode ser nula.");
        }

        if (request.userName() == null || request.userName().isBlank()) {
            throw new BadRequestException("O nome do responsável/usuário é obrigatório.");
        }

        if (request.niche() == null || request.niche().isBlank()) {
            throw new BadRequestException("O nicho de atuação é obrigatório para o cálculo de Cold Start.");
        }

        if (request.averageTicket() == null) {
            throw new BadRequestException("O ticket médio estimado é obrigatório.");
        }

        if (request.averageTicket().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("O ticket médio não pode ser negativo.");
        }

        validateTimes(request.openingTime(), request.closingTime());
        validateBusinessDays(request.businessDays());
    }

    private void validateTimes(String openingTime, String closingTime) {
        LocalTime parsedOpening = null;
        LocalTime parsedClosing = null;

        if (openingTime != null && !openingTime.isBlank()) {
            try {
                parsedOpening = LocalTime.parse(openingTime.trim());
            } catch (DateTimeParseException e) {
                throw new BadRequestException("Formato inválido para horário de abertura. Utilize HH:mm.");
            }
        }

        if (closingTime != null && !closingTime.isBlank()) {
            try {
                parsedClosing = LocalTime.parse(closingTime.trim());
            } catch (DateTimeParseException e) {
                throw new BadRequestException("Formato inválido para horário de fechamento. Utilize HH:mm.");
            }
        }

        if (parsedOpening != null && parsedClosing != null && parsedOpening.equals(parsedClosing)) {
            throw new BadRequestException("O horário de abertura e fechamento não podem ser idênticos.");
        }
    }

    private void validateBusinessDays(List<String> businessDays) {
        if (businessDays != null && businessDays.size() > 7) {
            throw new BadRequestException("A lista de dias de funcionamento não pode conter mais de 7 dias.");
        }
    }
}
