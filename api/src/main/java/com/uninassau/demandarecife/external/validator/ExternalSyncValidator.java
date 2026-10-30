package com.uninassau.demandarecife.external.validator;

import com.uninassau.demandarecife.shared.exception.BadRequestException;
import org.springframework.stereotype.Component;

@Component
public class ExternalSyncValidator {

    public void validateYearRange(int startYear, int endYear) {
        if (startYear > endYear) {
            throw new BadRequestException("O ano inicial não pode ser maior que o ano final.");
        }
        if (startYear < 1970 || endYear > 2100) {
            throw new BadRequestException("O intervalo de anos deve estar entre 1970 e 2100.");
        }
    }

    public void validateCity(String cidade) {
        if (cidade != null && cidade.trim().length() > 100) {
            throw new BadRequestException("O nome da cidade não pode ter mais de 100 caracteres.");
        }
    }
}
