package com.uninassau.demandarecife.products.dto;

public record StarterKitStatusDto(
        boolean applied,
        int totalSuggestions,
        int alreadyAdded,
        int pending
) {}
