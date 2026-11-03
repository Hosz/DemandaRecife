package com.uninassau.demandarecife.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 100, message = "O nome não pode ultrapassar 100 caracteres.")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "O e-mail informado é inválido.")
        @Size(max = 100, message = "O e-mail não pode ultrapassar 100 caracteres.")
        String email,

        @NotBlank(message = "A senha é obrigatória.")
        @Size(min = 6, max = 72, message = "A senha deve conter entre 6 e 72 caracteres.")
        String senha
) {}
