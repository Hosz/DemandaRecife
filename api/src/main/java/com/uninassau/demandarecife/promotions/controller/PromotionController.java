package com.uninassau.demandarecife.promotions.controller;

import com.uninassau.demandarecife.promotions.service.PromotionSimulationService;
import com.uninassau.demandarecife.promotions.dto.PromotionSimulation;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionSimulationService service;
    private final CurrentTenant currentTenant;

    // GET /api/promotions/simulation?productId=...                       -> só os limites
    // GET /api/promotions/simulation?productId=...&discountPercentage=20 -> simula desconto
    // GET /api/promotions/simulation?productId=...&targetPrice=7.50      -> simula preço-alvo
    @GetMapping("/simulation")
    public PromotionSimulation simulation(
            @RequestParam UUID productId,
            @RequestParam(required = false) BigDecimal discountPercentage,
            @RequestParam(required = false) BigDecimal targetPrice) {
        return service.simulate(currentTenant.id(), productId, discountPercentage, targetPrice);
    }
}