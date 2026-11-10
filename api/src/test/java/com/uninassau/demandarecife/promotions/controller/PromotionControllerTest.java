package com.uninassau.demandarecife.promotions.controller;

import com.uninassau.demandarecife.promotions.dto.CreateCampaignRequest;
import com.uninassau.demandarecife.promotions.entity.PromotionalCampaign;
import com.uninassau.demandarecife.promotions.repository.PromotionalCampaignRepository;
import com.uninassau.demandarecife.promotions.service.PromotionSimulationService;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionControllerTest {

    @Mock
    private PromotionSimulationService simulationService;

    @Mock
    private PromotionalCampaignRepository campaignRepository;

    @Mock
    private CurrentTenant currentTenant;

    @InjectMocks
    private PromotionController controller;

    @Test
    @DisplayName("Deve listar campanhas promocionais do tenant")
    void deveListarCampanhas() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);

        PromotionalCampaign c = new PromotionalCampaign(
                tenantId, UUID.randomUUID(), "Festival do Bolo", "+15% no ticket", 20, new BigDecimal("12.00"), "Ativa", "Hoje", "Amanhã", "São João"
        );
        when(campaignRepository.findByTenantIdOrderByCriadoEmDesc(tenantId)).thenReturn(List.of(c));

        var result = controller.listCampaigns();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().titulo()).isEqualTo("Festival do Bolo");
    }

    @Test
    @DisplayName("Deve criar campanha promocional")
    void deveCriarCampanha() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);

        CreateCampaignRequest req = new CreateCampaignRequest(
                UUID.randomUUID(), "Oferta Café", "+R$ 200", 15, new BigDecimal("8.50"), "Ativa", "Hoje", null, "São João"
        );

        PromotionalCampaign saved = new PromotionalCampaign(
                tenantId, req.productId(), req.titulo(), req.detalhe(), req.descontoPercentual(), req.precoPromocional(), req.status(), req.data(), req.dataFim(), req.eventoVinculado()
        );
        saved.setId(UUID.randomUUID());

        when(campaignRepository.save(any())).thenReturn(saved);

        var result = controller.createCampaign(req);

        assertThat(result.titulo()).isEqualTo("Oferta Café");
        assertThat(result.descontoPercentual()).isEqualTo(15);
    }
}
