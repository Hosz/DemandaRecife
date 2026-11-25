package com.uninassau.demandarecife.recommendations.service;

import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.team.dto.ShiftDto;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HeuristicRecommendationService {

    public List<AiRecommendation> generateAll(MerchantDailyContext ctx) {
        List<AiRecommendation> lista = new ArrayList<>();
        lista.add(generateEstoque(ctx));
        lista.add(generateEquipe(ctx));
        lista.add(generatePromocao(ctx));
        lista.add(generatePrevisao(ctx));
        return lista;
    }

    public AiRecommendation generate(MerchantDailyContext ctx) {
        if (ctx.comprasCriticas() != null && !ctx.comprasCriticas().isEmpty()) {
            return generateEstoque(ctx);
        }
        if (ctx.turnosDoDia() != null && ctx.turnosDoDia().stream().anyMatch(ShiftDto::vagaPendente)) {
            return generateEquipe(ctx);
        }
        if (ctx.feriadosProximos() != null && !ctx.feriadosProximos().isEmpty()) {
            return generatePromocao(ctx);
        }
        return generatePrevisao(ctx);
    }

    public AiRecommendation generateEstoque(MerchantDailyContext ctx) {
        AiRecommendation rec = baseEntity(ctx, RecommendationCategory.ESTOQUE);

        if (ctx.comprasCriticas() != null && !ctx.comprasCriticas().isEmpty()) {
            ReplenishmentSuggestion top = ctx.comprasCriticas().get(0);
            rec.setTitulo("Reposição Urgente: " + top.produto());
            rec.setDiagnostico(String.format(
                    "O estoque atual de %s (%d un.) está abaixo do estoque de segurança (%d un.). Risco iminente de desabastecimento.",
                    top.produto(), top.estoqueAtual(), top.estoqueMinimo()
            ));
            rec.setAcaoSugerida(String.format(
                    "Emitir pedido de reposição de %d un. hoje para suprir a demanda prevista.",
                    top.quantidadeSugerida()
            ));
            rec.setImpactoEstimado("Evita rupturas e perda direta de vendas");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "COMPRA_ESTOQUE");
            payload.put("productId", top.productId() != null ? top.productId().toString() : null);
            payload.put("quantidadeSugerida", top.quantidadeSugerida());
            payload.put("produto", top.produto());
            rec.setPayloadAcao(payload);
        } else {
            rec.setTitulo("Estoque Saudável: Auditoria de Giro");
            rec.setDiagnostico("Nenhum produto em nível crítico de ruptura no momento. Todos os itens monitorados estão acima da margem mínima de segurança.");
            rec.setAcaoSugerida("Realizar conferência amostral dos itens de maior saída para garantir a acurácia dos dados no fechamento de hoje.");
            rec.setImpactoEstimado("Acurácia de estoque em 99%");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "CONFERENCIA_ESTOQUE");
            rec.setPayloadAcao(payload);
        }
        return rec;
    }

    public AiRecommendation generateEquipe(MerchantDailyContext ctx) {
        AiRecommendation rec = baseEntity(ctx, RecommendationCategory.EQUIPE);

        Optional<ShiftDto> turnoComVaga = (ctx.turnosDoDia() != null)
                ? ctx.turnosDoDia().stream().filter(ShiftDto::vagaPendente).findFirst()
                : Optional.empty();

        if (turnoComVaga.isPresent()) {
            ShiftDto shift = turnoComVaga.get();
            rec.setTitulo("Reforço de Escala: Turno " + shift.horario());
            rec.setDiagnostico(String.format(
                    "O turno das %s possui posto de trabalho vago em dia com pico previsto para as %s (%s).",
                    shift.horario(), ctx.horarioPico(), ctx.faixaPico()
            ));
            rec.setAcaoSugerida(String.format(
                    "Alocar um colaborador para cobrir o turno das %s e evitar filas.",
                    shift.horario()
            ));
            rec.setImpactoEstimado("Atendimento até 30% mais ágil e redução de filas");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "REFORCO_TURNO");
            payload.put("shiftId", shift.id() != null ? shift.id().toString() : null);
            payload.put("horario", shift.horario());
            if (shift.horarioInicio() != null) payload.put("horarioInicio", shift.horarioInicio());
            if (shift.horarioFim() != null) payload.put("horarioFim", shift.horarioFim());
            if (shift.funcao() != null) payload.put("funcao", shift.funcao());
            payload.put("tipoDemanda", shift.tipoDemanda() != null ? shift.tipoDemanda() : "alta");
            rec.setPayloadAcao(payload);
        } else {
            rec.setTitulo("Escala Alinhada para o Pico das " + ctx.horarioPico());
            rec.setDiagnostico(String.format(
                    "Todos os postos de trabalho estão preenchidos para a faixa de maior movimento (%s).",
                    ctx.faixaPico()
            ));
            rec.setAcaoSugerida(String.format(
                    "Realizar alinhamento rápido de 5 minutos com a equipe às %s para sincronizar prioridades e atendimento rápido.",
                    ctx.horarios() != null ? ctx.horarios() : "abertura"
            ));
            rec.setImpactoEstimado("Operação sincronizada e agilidade no ápice");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "ALINHAMENTO_EQUIPE");
            payload.put("horario", ctx.faixaPico() != null ? ctx.faixaPico() : "17h–21h");
            payload.put("horarioInicio", "17:00");
            payload.put("horarioFim", "21:00");
            payload.put("funcao", "Atendimento / Balcão");
            payload.put("tipoDemanda", "alta");
            rec.setPayloadAcao(payload);
        }
        return rec;
    }

    public AiRecommendation generatePromocao(MerchantDailyContext ctx) {
        AiRecommendation rec = baseEntity(ctx, RecommendationCategory.PROMOCAO);

        if (ctx.feriadosProximos() != null && !ctx.feriadosProximos().isEmpty()) {
            String eventoStr = ctx.feriadosProximos().get(0);
            String nomeEvento = eventoStr;
            String dataEvento = null;
            if (eventoStr.contains("(") && eventoStr.contains(")")) {
                nomeEvento = eventoStr.substring(0, eventoStr.indexOf("(")).trim();
                dataEvento = eventoStr.substring(eventoStr.indexOf("(") + 1, eventoStr.indexOf(")")).trim();
            }
            rec.setTitulo("Campanha para: " + nomeEvento);
            rec.setDiagnostico(String.format(
                    "Feriado ou evento regional próximo detectado: %s. O fluxo de clientes na região de Recife tende a variar.",
                    eventoStr
            ));
            rec.setAcaoSugerida(String.format(
                    "Criar uma campanha promocional temática antecipada com 15%% OFF para capturar o fluxo das %s às 22:00.",
                    ctx.horarioPico() != null ? ctx.horarioPico() : "18:00"
            ));
            rec.setImpactoEstimado("Potencial de +15% a +25% no volume de vendas");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "CRIAR_PROMOCAO");
            payload.put("evento", nomeEvento);
            payload.put("desconto", 15);
            payload.put("dataInicio", "Hoje");
            payload.put("dataFim", dataEvento != null ? dataEvento : "Próximos 7 dias");
            payload.put("horarioInicio", ctx.horarioPico() != null ? ctx.horarioPico() : "18:00");
            payload.put("horarioFim", "22:00");
            rec.setPayloadAcao(payload);
        } else {
            rec.setTitulo("Combo Promocional de Elevação de Ticket");
            rec.setDiagnostico(String.format(
                    "Com o ticket médio atual em R$ %.2f para o nicho %s, ofertas casadas impulsionam o consumo por impulso.",
                    ctx.ticketMedio(), ctx.nicho() != null ? ctx.nicho() : "Comércio"
            ));
            rec.setAcaoSugerida("Agrupar os 2 produtos de maior saída em um combo com 12% de desconto no balcão das 18:00 às 22:00.");
            rec.setImpactoEstimado("+10% a +14% no ticket médio diário");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "COMBO_TICKET");
            payload.put("desconto", 12);
            payload.put("dataInicio", "Hoje");
            payload.put("dataFim", "Próximos 7 dias");
            payload.put("horarioInicio", "18:00");
            payload.put("horarioFim", "22:00");
            payload.put("isCombo", true);
            rec.setPayloadAcao(payload);
        }
        return rec;
    }

    public AiRecommendation generatePrevisao(MerchantDailyContext ctx) {
        AiRecommendation rec = baseEntity(ctx, RecommendationCategory.PREVISAO);

        if (ctx.climaCondicao() != null && (
                ctx.climaCondicao().toLowerCase().contains("chuv") ||
                ctx.climaCondicao().toLowerCase().contains("rain") ||
                ctx.climaCondicao().toLowerCase().contains("tempestade")
        )) {
            rec.setTitulo("Adaptação ao Clima: Chuva Prevista");
            rec.setDiagnostico(String.format(
                    "Previsão de %s (%s) para hoje em %s. Chuvas alteram a circulação de pedestres.",
                    ctx.climaCondicao(), ctx.climaTemperatura(), ctx.cidade()
            ));
            rec.setAcaoSugerida("Foque em canais de delivery e ofertas rápidas para sustentar as vendas durante o período de instabilidade.");
            rec.setImpactoEstimado("Mitigação de queda de fluxo presencial");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "FOCO_DELIVERY");
            payload.put("condicaoClima", ctx.climaCondicao());
            rec.setPayloadAcao(payload);
        } else {
            rec.setTitulo("Previsão de Fluxo: Preparação para " + ctx.horarioPico());
            rec.setDiagnostico(String.format(
                    "Padrões de mercado para %s em Recife indicam pico de movimento %s (ápice às %s).",
                    ctx.nicho() != null ? ctx.nicho() : "Comércio", ctx.faixaPico(), ctx.horarioPico()
            ));
            rec.setAcaoSugerida(String.format(
                    "Organize o reabastecimento de produtos e deixe os insumos principais preparados 30 minutos antes das %s.",
                    ctx.horarioPico()
            ));
            rec.setImpactoEstimado("Capacidade máxima de atendimento sem gargalos");

            Map<String, Object> payload = new HashMap<>();
            payload.put("tipoAcao", "PREPARO_PICO");
            payload.put("horarioPico", ctx.horarioPico());
            rec.setPayloadAcao(payload);
        }
        return rec;
    }

    private AiRecommendation baseEntity(MerchantDailyContext ctx, RecommendationCategory cat) {
        AiRecommendation rec = new AiRecommendation();
        rec.setTenantId(ctx.tenantId());
        rec.setDataReferencia(ctx.data());
        rec.setCategoria(cat);
        rec.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);
        rec.setStatus(RecommendationStatus.PENDENTE);
        return rec;
    }
}
