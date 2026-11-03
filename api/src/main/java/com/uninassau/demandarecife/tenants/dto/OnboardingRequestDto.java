package com.uninassau.demandarecife.tenants.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record OnboardingRequestDto(
        @NotBlank(message = "O nome do responsável é obrigatório.")
        @Size(max = 100, message = "O nome do responsável não pode ultrapassar 100 caracteres.")
        String userName,

        @Size(max = 100, message = "O nome do negócio não pode ultrapassar 100 caracteres.")
        String businessName,

        @NotBlank(message = "O nicho de atuação é obrigatório.")
        @Size(max = 50, message = "O nicho de atuação não pode ultrapassar 50 caracteres.")
        String niche,

        List<String> businessDays,

        String openingTime,

        String closingTime,

        @NotNull(message = "O ticket médio estimado é obrigatório.")
        @DecimalMin(value = "0.0", inclusive = true, message = "O ticket médio deve ser maior ou igual a zero.")
        BigDecimal averageTicket,

        @Size(max = 100, message = "A cidade não pode ultrapassar 100 caracteres.")
        String cidade,

        @Size(max = 2, message = "O estado deve ter 2 caracteres.")
        String estado,

        @Size(max = 100, message = "O bairro não pode ultrapassar 100 caracteres.")
        String bairro,

        @Size(max = 18, message = "O CNPJ não pode ultrapassar 18 caracteres.")
        String cnpj
) {}
