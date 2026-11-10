package com.uninassau.demandarecife.promotions.controller;

import com.uninassau.demandarecife.promotions.dto.CampaignDto;
import com.uninassau.demandarecife.promotions.dto.CreateCampaignRequest;
import com.uninassau.demandarecife.promotions.dto.PromotionSimulation;
import com.uninassau.demandarecife.promotions.entity.PromotionalCampaign;
import com.uninassau.demandarecife.promotions.repository.PromotionalCampaignRepository;
import com.uninassau.demandarecife.promotions.service.PromotionSimulationService;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionSimulationService service;
    private final PromotionalCampaignRepository campaignRepository;
    private final CurrentTenant currentTenant;

    @GetMapping("/simulation")
    public PromotionSimulation simulation(
            @RequestParam UUID productId,
            @RequestParam(required = false) BigDecimal discountPercentage,
            @RequestParam(required = false) BigDecimal targetPrice) {
        return service.simulate(currentTenant.id(), productId, discountPercentage, targetPrice);
    }

    @GetMapping("/campaigns")
    public List<CampaignDto> listCampaigns() {
        return campaignRepository.findByTenantIdOrderByCriadoEmDesc(currentTenant.id()).stream()
                .map(c -> new CampaignDto(
                        c.getId(),
                        c.getProductId(),
                        c.getTitulo(),
                        c.getDetalhe(),
                        c.getDescontoPercentual(),
                        c.getPrecoPromocional(),
                        c.getStatus(),
                        c.getDataCampanha(),
                        c.getDataFim(),
                        c.getEventoVinculado()
                ))
                .toList();
    }

    @PostMapping("/campaigns")
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignDto createCampaign(@Valid @RequestBody CreateCampaignRequest req) {
        PromotionalCampaign campaign = new PromotionalCampaign(
                currentTenant.id(),
                req.productId(),
                req.titulo(),
                req.detalhe(),
                req.descontoPercentual(),
                req.precoPromocional(),
                req.status() != null ? req.status() : "Ativa",
                req.data() != null ? req.data() : "Hoje",
                req.dataFim(),
                req.eventoVinculado()
        );
        PromotionalCampaign saved = campaignRepository.save(campaign);
        return new CampaignDto(
                saved.getId(),
                saved.getProductId(),
                saved.getTitulo(),
                saved.getDetalhe(),
                saved.getDescontoPercentual(),
                saved.getPrecoPromocional(),
                saved.getStatus(),
                saved.getDataCampanha(),
                saved.getDataFim(),
                saved.getEventoVinculado()
        );
    }

    @PutMapping("/campaigns/{id}")
    public CampaignDto updateCampaign(@PathVariable UUID id, @Valid @RequestBody CreateCampaignRequest req) {
        return campaignRepository.findById(id)
                .filter(c -> c.getTenantId().equals(currentTenant.id()))
                .map(c -> {
                    c.setTitulo(req.titulo());
                    if (req.detalhe() != null) c.setDetalhe(req.detalhe());
                    if (req.descontoPercentual() > 0) c.setDescontoPercentual(req.descontoPercentual());
                    if (req.precoPromocional() != null) c.setPrecoPromocional(req.precoPromocional());
                    if (req.status() != null) c.setStatus(req.status());
                    if (req.data() != null) c.setDataCampanha(req.data());
                    if (req.dataFim() != null) c.setDataFim(req.dataFim());
                    if (req.eventoVinculado() != null) c.setEventoVinculado(req.eventoVinculado());
                    PromotionalCampaign saved = campaignRepository.save(c);
                    return new CampaignDto(
                            saved.getId(),
                            saved.getProductId(),
                            saved.getTitulo(),
                            saved.getDetalhe(),
                            saved.getDescontoPercentual(),
                            saved.getPrecoPromocional(),
                            saved.getStatus(),
                            saved.getDataCampanha(),
                            saved.getDataFim(),
                            saved.getEventoVinculado()
                    );
                })
                .orElseThrow(() -> new IllegalArgumentException("Campanha não encontrada"));
    }

    @DeleteMapping("/campaigns/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCampaign(@PathVariable UUID id) {
        campaignRepository.deleteByTenantIdAndId(currentTenant.id(), id);
    }
}
