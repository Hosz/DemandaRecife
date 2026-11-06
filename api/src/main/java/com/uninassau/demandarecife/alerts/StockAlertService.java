package com.uninassau.demandarecife.alerts;

import com.uninassau.demandarecife.alerts.enums.AlertPriority;
import com.uninassau.demandarecife.alerts.enums.AlertStatus;
import com.uninassau.demandarecife.alerts.enums.AlertType;
import com.uninassau.demandarecife.replenishment.ReplenishmentService;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.shared.util.AppTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StockAlertService {

    private static final Set<AlertType> TIPOS_DE_ESTOQUE =
            EnumSet.of(AlertType.RUPTURA_ESTOQUE, AlertType.ESTOQUE_BAIXO);

    private final ReplenishmentService replenishmentService;
    private final OperationalAlertRepository alertRepository;
    private final ApplicationEventPublisher eventPublisher;

    public record Resultado(int criados, int resolvidos) {}

    @Transactional
    public Resultado avaliarEstoque(UUID tenantId) {
        // 1. O que está em risco agora (chave -> sugestão)
        Map<String, ReplenishmentSuggestion> emRisco = new LinkedHashMap<>();
        for (ReplenishmentSuggestion s : replenishmentService.suggestions(tenantId)) {
            if (s.comprarAgora()) {
                emRisco.put(chave(tipoDe(s), s.productId()), s);
            }
        }

        // 2. Alertas ativos: mantém os que continuam valendo e resolve os que passaram
        Set<String> jaAlertados = new HashSet<>();
        int resolvidos = 0;
        for (OperationalAlert alerta : alertRepository.findByTenantIdAndStatusAndTipoIn(
                tenantId, AlertStatus.ATIVO, TIPOS_DE_ESTOQUE)) {
            if (emRisco.containsKey(alerta.getChaveDeduplicacao())) {
                jaAlertados.add(alerta.getChaveDeduplicacao());
            } else {
                alerta.setStatus(AlertStatus.RESOLVIDO);
                alerta.setResolvidoEm(AppTime.now());
                resolvidos++;
            }
        }

        // 3. Cria só o que ainda não tem alerta ativo (deduplicação)
        int criados = 0;
        for (Map.Entry<String, ReplenishmentSuggestion> e : emRisco.entrySet()) {
            if (jaAlertados.contains(e.getKey())) continue;
            var alerta = novoAlerta(tenantId, e.getKey(), e.getValue());
            alertRepository.save(alerta);
            eventPublisher.publishEvent(new AlertCreatedEvent(tenantId, alerta.getProductId(), alerta.getTitulo(),
                    alerta.getDescricao(), alerta.getPrioridade().name(), alerta.getChaveDeduplicacao()));
            criados++;
        }
        return new Resultado(criados, resolvidos);
    }

    static String chave(AlertType tipo, UUID productId) {
        return tipo.name() + ":" + productId;
    }

    private static AlertType tipoDe(ReplenishmentSuggestion s) {
        return s.estoqueAtual() <= 0 ? AlertType.RUPTURA_ESTOQUE : AlertType.ESTOQUE_BAIXO;
    }

    private static OperationalAlert novoAlerta(UUID tenantId, String chave, ReplenishmentSuggestion s) {
        boolean ruptura = tipoDe(s) == AlertType.RUPTURA_ESTOQUE;

        var alerta = new OperationalAlert();
        alerta.setTenantId(tenantId);
        alerta.setProductId(s.productId());
        alerta.setChaveDeduplicacao(chave);
        alerta.setTipo(tipoDe(s));
        alerta.setPrioridade(ruptura ? AlertPriority.ALTA : AlertPriority.MEDIA);
        if (ruptura) {
            alerta.setTitulo("Acabou: " + s.produto());
            alerta.setDescricao("O estoque de " + s.produto() + " zerou. Compre "
                    + s.quantidadeSugerida() + " unidades para voltar ao normal.");
        } else {
            alerta.setTitulo("Estoque baixo: " + s.produto());
            alerta.setDescricao("Restam " + s.estoqueAtual() + " unidades de " + s.produto()
                    + ". O ideal é ter pelo menos " + s.estoqueMinimo() + ". Sugestão: comprar "
                    + s.quantidadeSugerida() + ".");
        }
        alerta.setDados(Map.of(
                "estoqueAtual", s.estoqueAtual(),
                "estoqueMinimo", s.estoqueMinimo(),
                "estoqueMaximo", s.estoqueMaximo(),
                "quantidadeSugerida", s.quantidadeSugerida()));
        return alerta;
    }
}