package com.uninassau.demandarecife.alerts;

import com.uninassau.demandarecife.alerts.enums.AlertPriority;
import com.uninassau.demandarecife.alerts.enums.AlertStatus;
import com.uninassau.demandarecife.alerts.enums.AlertType;
import com.uninassau.demandarecife.replenishment.ReplenishmentService;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockAlertServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID PRODUTO = UUID.randomUUID();

    @Mock ReplenishmentService replenishmentService;
    @Mock OperationalAlertRepository alertRepository;
    @Mock ApplicationEventPublisher eventPublisher;
    @InjectMocks StockAlertService service;

    private ReplenishmentSuggestion sugestao(int atual, boolean comprar) {
        return new ReplenishmentSuggestion(PRODUTO, "Pão Francês", atual, 10, 50, comprar,
                comprar ? 50 - atual : 0, ReplenishmentSuggestion.Metodo.PREVISAO);
    }

    private OperationalAlert alertaAtivo(AlertType tipo) {
        var a = new OperationalAlert();
        a.setTenantId(TENANT);
        a.setProductId(PRODUTO);
        a.setTipo(tipo);
        a.setChaveDeduplicacao(StockAlertService.chave(tipo, PRODUTO));
        return a;
    }

    private void cenario(List<ReplenishmentSuggestion> sugestoes, List<OperationalAlert> ativos) {
        when(replenishmentService.suggestions(TENANT)).thenReturn(sugestoes);
        when(alertRepository.findByTenantIdAndStatusAndTipoIn(eq(TENANT), eq(AlertStatus.ATIVO), any()))
                .thenReturn(ativos);
    }

    @BeforeEach
    void setUp() {
        // nada em comum: cada teste monta o seu cenário
    }

    @Test
    void estoqueZeradoCriaAlertaDeRupturaComPrioridadeAlta() {
        cenario(List.of(sugestao(0, true)), List.of());

        var resultado = service.avaliarEstoque(TENANT);

        var captor = ArgumentCaptor.forClass(OperationalAlert.class);
        verify(alertRepository).save(captor.capture());
        var alerta = captor.getValue();
        assertThat(alerta.getTipo()).isEqualTo(AlertType.RUPTURA_ESTOQUE);
        assertThat(alerta.getPrioridade()).isEqualTo(AlertPriority.ALTA);
        assertThat(alerta.getStatus()).isEqualTo(AlertStatus.ATIVO);
        assertThat(alerta.getChaveDeduplicacao()).isEqualTo("RUPTURA_ESTOQUE:" + PRODUTO);
        assertThat(alerta.getTitulo()).contains("Pão Francês");
        assertThat(alerta.getDados()).containsEntry("estoqueAtual", 0).containsEntry("quantidadeSugerida", 50);
        assertThat(resultado.criados()).isEqualTo(1);
    }

    @Test
    void estoqueBaixoCriaAlertaComPrioridadeMedia() {
        cenario(List.of(sugestao(3, true)), List.of());

        service.avaliarEstoque(TENANT);

        var captor = ArgumentCaptor.forClass(OperationalAlert.class);
        verify(alertRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(AlertType.ESTOQUE_BAIXO);
        assertThat(captor.getValue().getPrioridade()).isEqualTo(AlertPriority.MEDIA);
    }

    @Test
    void problemaQueContinuaNaoGeraAlertaDuplicado() {
        cenario(List.of(sugestao(3, true)), List.of(alertaAtivo(AlertType.ESTOQUE_BAIXO)));

        var resultado = service.avaliarEstoque(TENANT);

        verify(alertRepository, never()).save(any());
        assertThat(resultado.criados()).isZero();
        assertThat(resultado.resolvidos()).isZero();
    }

    @Test
    void estoqueRepostoResolveOAlertaAtivo() {
        var ativo = alertaAtivo(AlertType.ESTOQUE_BAIXO);
        cenario(List.of(sugestao(200, false)), List.of(ativo));

        var resultado = service.avaliarEstoque(TENANT);

        assertThat(ativo.getStatus()).isEqualTo(AlertStatus.RESOLVIDO);
        assertThat(ativo.getResolvidoEm()).isNotNull();
        assertThat(resultado.resolvidos()).isEqualTo(1);
        verify(alertRepository, never()).save(any());
    }

    @Test
    void quandoOEstoqueBaixoZeraResolveOBaixoECriaARuptura() {
        var baixo = alertaAtivo(AlertType.ESTOQUE_BAIXO);
        cenario(List.of(sugestao(0, true)), List.of(baixo));

        var resultado = service.avaliarEstoque(TENANT);

        assertThat(baixo.getStatus()).isEqualTo(AlertStatus.RESOLVIDO);
        var captor = ArgumentCaptor.forClass(OperationalAlert.class);
        verify(alertRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(AlertType.RUPTURA_ESTOQUE);
        assertThat(resultado.criados()).isEqualTo(1);
        assertThat(resultado.resolvidos()).isEqualTo(1);
    }

    @Test
    void produtoForaDeRiscoSemAlertaNaoFazNada() {
        cenario(List.of(sugestao(200, false)), List.of());

        var resultado = service.avaliarEstoque(TENANT);

        verify(alertRepository, never()).save(any());
        assertThat(resultado.criados()).isZero();
        assertThat(resultado.resolvidos()).isZero();
    }

    @Test
    void alertaNovoPublicaEventoParaOPush() {
        cenario(List.of(sugestao(0, true)), List.of());

        service.avaliarEstoque(TENANT);

        var captor = ArgumentCaptor.forClass(AlertCreatedEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().tenantId()).isEqualTo(TENANT);
        assertThat(captor.getValue().titulo()).contains("Pão Francês");
        assertThat(captor.getValue().prioridade()).isEqualTo("ALTA");
    }

    @Test
    void problemaQueContinuaNaoPublicaEvento() {
        cenario(List.of(sugestao(3, true)), List.of(alertaAtivo(AlertType.ESTOQUE_BAIXO)));

        service.avaliarEstoque(TENANT);

        verify(eventPublisher, never()).publishEvent(any(Object.class));
    }
}