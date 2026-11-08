package com.uninassau.demandarecife.dashboard.controller;

import com.uninassau.demandarecife.dashboard.dto.DailyBriefingResponseDTO;
import com.uninassau.demandarecife.dashboard.service.DailyBriefingService;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DailyBriefingService service;
    private final CurrentTenant currentTenant;

    @GetMapping("/daily-briefing")
    public DailyBriefingResponseDTO dailyBriefing() {
        return service.montar(currentTenant.id());
    }
}