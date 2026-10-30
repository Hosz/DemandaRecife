package com.uninassau.demandarecife.tenants.validator;

import com.uninassau.demandarecife.shared.exception.BadRequestException;
import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TenantOnboardingValidatorTest {

    private TenantOnboardingValidator validator;

    @BeforeEach
    void setUp() {
        validator = new TenantOnboardingValidator();
    }

    @Test
    void validateOnboarding_quandoRequestValido_naoLancaExcecao() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                "Padaria Delícia",
                "Padaria / Confeitaria",
                List.of("SEG", "TER", "QUA", "QUI", "SEX"),
                "08:00",
                "18:00",
                new BigDecimal("45.00"),
                "Recife",
                "PE",
                "Boa Viagem",
                null
        );

        assertThatCode(() -> validator.validateOnboarding(request))
                .doesNotThrowAnyException();
    }

    @Test
    void validateOnboarding_quandoRequestNulo_lancaBadRequestException() {
        assertThatThrownBy(() -> validator.validateOnboarding(null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("não pode ser nula");
    }

    @Test
    void validateOnboarding_quandoUserNameVazio_lancaBadRequestException() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "   ",
                null,
                "Padaria",
                List.of("SEG"),
                "08:00",
                "18:00",
                new BigDecimal("10.00"),
                null, null, null, null
        );

        assertThatThrownBy(() -> validator.validateOnboarding(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("nome do responsável");
    }

    @Test
    void validateOnboarding_quandoNicheVazio_lancaBadRequestException() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                null,
                "",
                List.of("SEG"),
                "08:00",
                "18:00",
                new BigDecimal("10.00"),
                null, null, null, null
        );

        assertThatThrownBy(() -> validator.validateOnboarding(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("nicho de atuação");
    }

    @Test
    void validateOnboarding_quandoTicketMedioNegativo_lancaBadRequestException() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                null,
                "Padaria",
                List.of("SEG"),
                "08:00",
                "18:00",
                new BigDecimal("-5.00"),
                null, null, null, null
        );

        assertThatThrownBy(() -> validator.validateOnboarding(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("não pode ser negativo");
    }

    @Test
    void validateOnboarding_quandoHorarioAberturaInvalido_lancaBadRequestException() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                null,
                "Padaria",
                List.of("SEG"),
                "25:99",
                "18:00",
                new BigDecimal("10.00"),
                null, null, null, null
        );

        assertThatThrownBy(() -> validator.validateOnboarding(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Formato inválido para horário de abertura");
    }

    @Test
    void validateOnboarding_quandoHorariosIguais_lancaBadRequestException() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                null,
                "Padaria",
                List.of("SEG"),
                "08:00",
                "08:00",
                new BigDecimal("10.00"),
                null, null, null, null
        );

        assertThatThrownBy(() -> validator.validateOnboarding(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("não podem ser idênticos");
    }
}
