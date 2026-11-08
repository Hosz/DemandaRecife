package com.uninassau.demandarecife.push.dto;

import jakarta.validation.constraints.NotBlank;

public record UnsubscribeRequest(@NotBlank String endpoint) {}