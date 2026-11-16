package com.uninassau.demandarecife.recommendations.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uninassau.demandarecife.recommendations.dto.GeminiRecommendationPayload;
import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class GeminiRecommendationService {

    private static final String DEFAULT_MODEL = "gemini-3.5-flash";
    private static final String FALLBACK_MODEL = "gemini-3.1-flash-lite";
    private static final String OPENAI_COMPAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    private final ObjectProvider<ChatModel> chatModelProvider;
    private final HeuristicRecommendationService heuristicFallback;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${spring.ai.openai.api-key:dummy}")
    private String apiKeyConfigured;

    /**
     * Quando true, bloqueia qualquer leitura de arquivo/env e força o fallback heurístico.
     * Usado exclusivamente em testes unitários para isolamento hermático.
     */
    private boolean forceHeuristicFallback = false;

    @Autowired
    public GeminiRecommendationService(
            ObjectProvider<ChatModel> chatModelProvider,
            HeuristicRecommendationService heuristicFallback
    ) {
        this.chatModelProvider = chatModelProvider;
        this.heuristicFallback = heuristicFallback;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public GeminiRecommendationService(
            ObjectProvider<ChatModel> chatModelProvider,
            HeuristicRecommendationService heuristicFallback,
            ObjectMapper objectMapper
    ) {
        this.chatModelProvider = chatModelProvider;
        this.heuristicFallback = heuristicFallback;
        this.objectMapper = (objectMapper != null) ? objectMapper : new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @PostConstruct
    public void logApiKeyStatus() {
        String key = resolveApiKey();
        if (key != null) {
            log.info("GeminiRecommendationService inicializado. API Key: ...{}  (IA ativa)",
                    key.substring(Math.max(0, key.length() - 6)));
        } else {
            log.warn("GeminiRecommendationService: GEMINI_API_KEY não encontrada. Modo fallback heurístico ativo.");
        }
    }

    public List<AiRecommendation> generateRecommendations(MerchantDailyContext ctx) {
        String key = resolveApiKey();
        if (key == null || key.isBlank() || "dummy".equalsIgnoreCase(key.trim())) {
            log.info("API Key do Gemini/OpenAI não informada ou dummy. Usando contingência heurística para todas as áreas.");
            return heuristicFallback.generateAll(ctx);
        }

        try {
            String systemText = """
                Você é o consultor executivo de Inteligência Artificial do DemandaRecife para o comércio de Pernambuco.
                Sua missão é analisar os dados operacionais do lojista (nicho, bairro, horários, compras críticas de estoque, equipe, fluxo, clima e feriados locais) e gerar EXATAMENTE UMA recomendação prática e prescritiva para CADA UMA das seguintes 4 áreas da aplicação:
                1. ESTOQUE
                2. EQUIPE
                3. PROMOCAO
                4. PREVISAO
                
                Responda OBRIGATORIAMENTE em formato JSON válido com a seguinte estrutura exata:
                {
                  "recomendacoes": [
                    {
                      "categoria": "ESTOQUE",
                      "titulo": "Título curto (máx 80 caracteres)",
                      "diagnostico": "Cenário identificado cruzando os dados",
                      "acaoSugerida": "Ação prática clara",
                      "impactoEstimado": "Impacto no negócio (ex: '+15% conversão')",
                      "tipoAcao": "COMPRA_ESTOQUE",
                      "detalhesAcao": {}
                    },
                    {
                      "categoria": "EQUIPE",
                      "titulo": "Reforço de Escala: Turno 17h–21h",
                      "diagnostico": "Cenário de fluxo de clientes e gargalo na escala",
                      "acaoSugerida": "Alocar colaborador no turno de maior movimento para evitar filas",
                      "impactoEstimado": "Atendimento até 30% mais ágil e redução de filas",
                      "tipoAcao": "REFORCO_TURNO",
                      "detalhesAcao": {
                        "horario": "17h–21h",
                        "horarioInicio": "17:00",
                        "horarioFim": "21:00",
                        "funcao": "Atendimento / Balcão",
                        "tipoDemanda": "alta"
                      }
                    },
                    {
                      "categoria": "PROMOCAO",
                      "titulo": "Título curto da promoção",
                      "diagnostico": "Cenário de oportunidade ou evento",
                      "acaoSugerida": "Ação promocional prática recomendada",
                      "impactoEstimado": "+X% nas vendas ou ticket médio",
                      "tipoAcao": "CRIAR_PROMOCAO",
                      "detalhesAcao": {
                        "desconto": 15,
                        "horarioInicio": "18:00",
                        "horarioFim": "22:00",
                        "dataInicio": "Hoje",
                        "dataFim": "24/06",
                        "evento": "Nome do feriado ou null",
                        "isCombo": false,
                        "produtos": ["Nome de 1 ou mais produtos"]
                      }
                    },
                    {
                      "categoria": "PREVISAO",
                      "titulo": "...",
                      "diagnostico": "...",
                      "acaoSugerida": "...",
                      "impactoEstimado": "...",
                      "tipoAcao": "PREPARO_PICO",
                      "detalhesAcao": {}
                    }
                  ]
                }
                """;

            String userText = formatUserContext(ctx);
            String responseContent = callGeminiWithFallback(key, systemText, userText);

            if (responseContent == null || responseContent.isBlank()) {
                log.warn("Resposta vazia da API do Gemini. Usando contingência heurística.");
                return heuristicFallback.generateAll(ctx);
            }

            List<AiRecommendation> list = parseMultiResponse(ctx, responseContent);
            return ensureAllCategoriesPresent(ctx, list);

        } catch (Exception ex) {
            log.warn("Erro ao gerar recomendações via Gemini: {}. Usando contingência heurística.", ex.getMessage());
            return heuristicFallback.generateAll(ctx);
        }
    }

    public AiRecommendation generateRecommendation(MerchantDailyContext ctx) {
        List<AiRecommendation> all = generateRecommendations(ctx);
        return all.isEmpty() ? heuristicFallback.generate(ctx) : all.get(0);
    }

    private String callGeminiWithFallback(String key, String systemPrompt, String userPrompt) throws Exception {
        try {
            return executeHttpRequest(key, DEFAULT_MODEL, systemPrompt, userPrompt);
        } catch (Exception ex) {
            log.warn("Falha no modelo principal {}: {}. Tentando modelo fallback {}", DEFAULT_MODEL, ex.getMessage(), FALLBACK_MODEL);
            return executeHttpRequest(key, FALLBACK_MODEL, systemPrompt, userPrompt);
        }
    }

    private String executeHttpRequest(String key, String model, String systemPrompt, String userPrompt) throws Exception {
        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("model", model);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        );
        reqBody.put("messages", messages);

        String jsonBody = objectMapper.writeValueAsString(reqBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENAI_COMPAT_URL))
                .header("Authorization", "Bearer " + key)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP " + response.statusCode() + " da API Gemini: " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            return choices.get(0).path("message").path("content").asText();
        }
        throw new RuntimeException("Estrutura inesperada na resposta do Gemini: " + response.body());
    }

    private List<AiRecommendation> parseMultiResponse(MerchantDailyContext ctx, String raw) {
        List<AiRecommendation> resultados = new ArrayList<>();
        String cleaned = cleanJson(raw);

        try {
            JsonNode root = objectMapper.readTree(cleaned);

            JsonNode listNode = root.has("recomendacoes") ? root.get("recomendacoes") : (root.isArray() ? root : null);

            if (listNode != null && listNode.isArray()) {
                for (JsonNode itemNode : listNode) {
                    GeminiRecommendationPayload payload = objectMapper.treeToValue(itemNode, GeminiRecommendationPayload.class);
                    resultados.add(toEntity(ctx, payload));
                }
            } else if (root.isObject()) {
                GeminiRecommendationPayload single = objectMapper.treeToValue(root, GeminiRecommendationPayload.class);
                resultados.add(toEntity(ctx, single));
            }
        } catch (Exception ex) {
            log.warn("Erro ao desserializar JSON do Gemini: {}. Texto bruto: {}", ex.getMessage(), cleaned);
        }

        return resultados;
    }

    private List<AiRecommendation> ensureAllCategoriesPresent(MerchantDailyContext ctx, List<AiRecommendation> list) {
        Map<RecommendationCategory, AiRecommendation> map = new LinkedHashMap<>();
        for (AiRecommendation r : list) {
            if (r.getCategoria() != null) {
                map.putIfAbsent(r.getCategoria(), r);
            }
        }

        List<AiRecommendation> fallbacks = heuristicFallback.generateAll(ctx);
        for (AiRecommendation fb : fallbacks) {
            if (!map.containsKey(fb.getCategoria())) {
                map.put(fb.getCategoria(), fb);
            }
        }

        return new ArrayList<>(map.values());
    }

    private String cleanJson(String raw) {
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private String formatUserContext(MerchantDailyContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("--- DADOS OPERACIONAIS DO LOJISTA ---\n");
        sb.append(String.format("Empresa: %s | Local: %s, %s | Horário: %s | Ticket Médio: R$ %s\n",
                ctx.nicho(), ctx.bairro(), ctx.cidade(), ctx.horarios(), ctx.ticketMedio()));
        sb.append(String.format("Data: %s (%s) | Clima: %s, %s\n",
                ctx.data(), ctx.diaSemana(), ctx.climaCondicao(), ctx.climaTemperatura()));

        if (ctx.feriadosProximos() != null && !ctx.feriadosProximos().isEmpty()) {
            sb.append("Feriados/Eventos Próximos em PE: ").append(String.join(", ", ctx.feriadosProximos())).append("\n");
        } else {
            sb.append("Feriados/Eventos Próximos: Nenhum feriado no período imediato\n");
        }

        sb.append(String.format("Fluxo Previsto: Horário de pico às %s (%s)\n", ctx.horarioPico(), ctx.faixaPico()));

        if (ctx.comprasCriticas() != null && !ctx.comprasCriticas().isEmpty()) {
            sb.append("Itens com risco de ruptura no estoque:\n");
            for (var item : ctx.comprasCriticas()) {
                sb.append(String.format(" - %s: Estoque atual %d un, Mínimo %d un. Sugestão compra: %d un.\n",
                        item.produto(), item.estoqueAtual(), item.estoqueMinimo(), item.quantidadeSugerida()));
            }
        } else {
            sb.append("Estoque: Nenhum item em nível crítico de ruptura hoje.\n");
        }

        if (ctx.turnosDoDia() != null && !ctx.turnosDoDia().isEmpty()) {
            sb.append("Escala de equipe hoje:\n");
            for (var shift : ctx.turnosDoDia()) {
                sb.append(String.format(" - Turno %s (%s demanda) | Colaboradores: %s | Vaga pendente: %s\n",
                        shift.horario(), shift.tipoDemanda(), String.join(", ", shift.funcionarios()), shift.vagaPendente() ? "SIM" : "NÃO"));
            }
        }

        sb.append(String.format("Alertas operacionais ativos: %d\n", ctx.totalAlertasAtivos()));
        sb.append("-------------------------------------\n");
        sb.append("Gere as 4 recomendações para hoje.");
        return sb.toString();
    }

    private AiRecommendation toEntity(MerchantDailyContext ctx, GeminiRecommendationPayload payload) {
        AiRecommendation rec = new AiRecommendation();
        rec.setTenantId(ctx.tenantId());
        rec.setDataReferencia(ctx.data());

        RecommendationCategory cat = RecommendationCategory.PREVISAO;
        if (payload.categoria() != null) {
            try {
                cat = RecommendationCategory.valueOf(payload.categoria().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // mantém padrão seguro
            }
        }
        rec.setCategoria(cat);
        rec.setTitulo(payload.titulo() != null ? payload.titulo() : "Recomendação Preditiva");
        rec.setDiagnostico(payload.diagnostico() != null ? payload.diagnostico() : "Diagnóstico operacional");
        rec.setAcaoSugerida(payload.acaoSugerida() != null ? payload.acaoSugerida() : "Ação preventiva recomendada");
        rec.setImpactoEstimado(payload.impactoEstimado());
        rec.setOrigem(RecommendationOrigin.IA_GEMINI);
        rec.setStatus(RecommendationStatus.PENDENTE);

        Map<String, Object> finalPayload = new HashMap<>();
        if (payload.tipoAcao() != null) {
            finalPayload.put("tipoAcao", payload.tipoAcao());
        }
        if (payload.detalhesAcao() != null) {
            finalPayload.putAll(payload.detalhesAcao());
        }
        rec.setPayloadAcao(finalPayload);

        return rec;
    }

    private String resolveApiKey() {
        // Flag de teste: bloqueia todas as fontes e força fallback heurístico.
        if (forceHeuristicFallback) return null;
        String envKey = System.getenv("GEMINI_API_KEY");
        if (isValidKey(envKey)) return envKey.trim();

        String openAiEnvKey = System.getenv("OPENAI_API_KEY");
        if (isValidKey(openAiEnvKey)) return openAiEnvKey.trim();

        // 2. System property (definida por loadDotenv() ou -DGEMINI_API_KEY=...)
        String sysKey = System.getProperty("GEMINI_API_KEY");
        if (isValidKey(sysKey)) return sysKey.trim();

        // 3. Lê diretamente o arquivo .env — cobre o caso em que o IntelliJ não propagou
        //    a env var ao processo JVM (a var fica vazia no ambiente do processo).
        String fileKey = readKeyFromEnvFiles();
        if (isValidKey(fileKey)) return fileKey.trim();

        // 4. Valor resolvido pelo Spring @Value — só chega aqui se todas as fontes
        //    acima falharem. Pode ser "dummy" se o Spring não achou GEMINI_API_KEY.
        if (isValidKey(apiKeyConfigured)) return apiKeyConfigured.trim();

        return null;
    }

    private boolean isValidKey(String key) {
        return key != null && !key.isBlank()
                && !"dummy".equalsIgnoreCase(key.trim())
                && !"disabled".equalsIgnoreCase(key.trim());
    }

    private String readKeyFromEnvFiles() {
        // Tenta vários caminhos: relativo ao CWD do processo e absoluto baseado no location do jar
        List<String> paths = new ArrayList<>(List.of(".env", "api/.env", "../.env", "../../.env"));
        // Adiciona caminho absoluto baseado na localização do .class em execução
        try {
            String jarDir = new File(GeminiRecommendationService.class
                    .getProtectionDomain().getCodeSource().getLocation().toURI()).getParentFile().getAbsolutePath();
            paths.add(jarDir + "/.env");
            paths.add(jarDir + "/../.env");
            paths.add(jarDir + "/../../.env");
            paths.add(jarDir + "/../../../.env"); // target/classes/../../.. = módulo api/
        } catch (Exception ignored) {}
        for (String p : paths) {
            File f = new File(p);
            if (f.exists()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(f))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.startsWith("GEMINI_API_KEY=") || line.startsWith("OPENAI_API_KEY=")) {
                            int eq = line.indexOf('=');
                            String val = line.substring(eq + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (!val.isBlank() && !"dummy".equalsIgnoreCase(val)) {
                                return val;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return null;
    }
}
