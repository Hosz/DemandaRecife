package com.uninassau.demandarecife.recommendations.service;

import com.uninassau.demandarecife.recommendations.dto.AiRecommendationDto;
import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.recommendations.repository.AiRecommendationRepository;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import com.uninassau.demandarecife.shared.util.AppTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationOrchestratorService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");

    private final AiRecommendationRepository repository;
    private final AiContextBuilder contextBuilder;
    private final GeminiRecommendationService geminiService;
    private final ConcurrentHashMap<UUID, Object> tenantLocks = new ConcurrentHashMap<>();

    public List<AiRecommendationDto> getDailyRecommendations(UUID tenantId, LocalDate dataReferencia) {
        LocalDate data = (dataReferencia != null) ? dataReferencia : LocalDate.now(ZONA);

        // 1. Verificação rápida em cache sem lock
        List<AiRecommendation> existentes = repository.findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(tenantId, data);
        if (!existentes.isEmpty()) {
            return existentes.stream().map(AiRecommendationDto::fromEntity).toList();
        }

        // 2. Lock por tenant para serializar o primeiro acesso do dia
        Object lock = tenantLocks.computeIfAbsent(tenantId, k -> new Object());
        synchronized (lock) {
            // Double-check após obter o lock
            existentes = repository.findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(tenantId, data);
            if (!existentes.isEmpty()) {
                return existentes.stream().map(AiRecommendationDto::fromEntity).toList();
            }

            MerchantDailyContext ctx = contextBuilder.buildContext(tenantId, data);
            List<AiRecommendation> novas = geminiService.generateRecommendations(ctx);

            List<AiRecommendation> salvas = new ArrayList<>();
            for (AiRecommendation nova : novas) {
                nova.setTenantId(tenantId);
                nova.setDataReferencia(data);
                nova.setStatus(RecommendationStatus.PENDENTE);
                try {
                    salvas.add(repository.saveAndFlush(nova));
                } catch (Exception ex) {
                    log.info("Concorrência ao persistir área {} para o tenant {}: {}", nova.getCategoria(), tenantId, ex.getMessage());
                    repository.findByTenantIdAndDataReferenciaAndCategoria(tenantId, data, nova.getCategoria())
                            .ifPresent(salvas::add);
                }
            }

            return salvas.isEmpty()
                    ? novas.stream().map(AiRecommendationDto::fromEntity).toList()
                    : salvas.stream().map(AiRecommendationDto::fromEntity).toList();
        }
    }

    public List<AiRecommendationDto> regenerateDailyRecommendations(UUID tenantId, LocalDate dataReferencia) {
        LocalDate data = (dataReferencia != null) ? dataReferencia : LocalDate.now(ZONA);

        Object lock = tenantLocks.computeIfAbsent(tenantId, k -> new Object());
        synchronized (lock) {
            MerchantDailyContext ctx = contextBuilder.buildContext(tenantId, data);
            List<AiRecommendation> novas = geminiService.generateRecommendations(ctx);

            List<AiRecommendation> salvas = new ArrayList<>();
            for (AiRecommendation nova : novas) {
                Optional<AiRecommendation> existente = repository.findByTenantIdAndDataReferenciaAndCategoria(tenantId, data, nova.getCategoria());
                AiRecommendation entidade;
                if (existente.isPresent()) {
                    entidade = existente.get();
                    entidade.setTitulo(nova.getTitulo());
                    entidade.setDiagnostico(nova.getDiagnostico());
                    entidade.setAcaoSugerida(nova.getAcaoSugerida());
                    entidade.setImpactoEstimado(nova.getImpactoEstimado());
                    entidade.setPayloadAcao(nova.getPayloadAcao());
                    entidade.setOrigem(nova.getOrigem());
                    entidade.setStatus(RecommendationStatus.PENDENTE);
                    entidade.setAplicadoEm(null);
                    entidade.setAtualizadoEm(AppTime.now());
                } else {
                    nova.setTenantId(tenantId);
                    nova.setDataReferencia(data);
                    nova.setStatus(RecommendationStatus.PENDENTE);
                    entidade = nova;
                }
                salvas.add(repository.saveAndFlush(entidade));
            }

            return salvas.stream().map(AiRecommendationDto::fromEntity).toList();
        }
    }

    public AiRecommendationDto getDailyRecommendation(UUID tenantId, LocalDate dataReferencia) {
        List<AiRecommendationDto> todas = getDailyRecommendations(tenantId, dataReferencia);
        return todas.isEmpty() ? null : todas.get(0);
    }

    public AiRecommendationDto regenerateDailyRecommendation(UUID tenantId, LocalDate dataReferencia) {
        List<AiRecommendationDto> todas = regenerateDailyRecommendations(tenantId, dataReferencia);
        return todas.isEmpty() ? null : todas.get(0);
    }

    @Transactional
    public AiRecommendationDto applyRecommendation(UUID tenantId, UUID recommendationId) {
        AiRecommendation rec = repository.findByIdAndTenantId(recommendationId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Recomendação não encontrada."));

        rec.setStatus(RecommendationStatus.APLICADO);
        rec.setAplicadoEm(AppTime.now());
        AiRecommendation salva = repository.save(rec);
        return AiRecommendationDto.fromEntity(salva);
    }

    @Transactional
    public AiRecommendationDto dismissRecommendation(UUID tenantId, UUID recommendationId) {
        AiRecommendation rec = repository.findByIdAndTenantId(recommendationId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Recomendação não encontrada."));

        rec.setStatus(RecommendationStatus.DISPENSADO);
        AiRecommendation salva = repository.save(rec);
        return AiRecommendationDto.fromEntity(salva);
    }
}
