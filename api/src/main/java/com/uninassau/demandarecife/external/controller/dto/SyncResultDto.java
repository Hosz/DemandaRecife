package com.uninassau.demandarecife.external.controller.dto;

public record SyncResultDto(
        String status,
        String message,
        int totalProcessed
) {
    public static SyncResultDto success(String message, int totalProcessed) {
        return new SyncResultDto("SUCCESS", message, totalProcessed);
    }

    public static SyncResultDto error(String message) {
        return new SyncResultDto("ERROR", message, 0);
    }
}
