package com.uninassau.demandarecife.recommendations.repository;

import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, UUID> {

    List<AiRecommendation> findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(UUID tenantId, LocalDate dataReferencia);

    List<AiRecommendation> findAllByTenantIdAndDataReferencia(UUID tenantId, LocalDate dataReferencia);

    Optional<AiRecommendation> findFirstByTenantIdAndDataReferenciaOrderByCriadoEmDesc(UUID tenantId, LocalDate dataReferencia);

    Optional<AiRecommendation> findByTenantIdAndDataReferenciaAndCategoria(UUID tenantId, LocalDate dataReferencia, RecommendationCategory categoria);

    Optional<AiRecommendation> findByIdAndTenantId(UUID id, UUID tenantId);

    List<AiRecommendation> findByTenantIdOrderByDataReferenciaDesc(UUID tenantId);

    List<AiRecommendation> findByTenantIdAndStatus(UUID tenantId, RecommendationStatus status);

    void deleteAllByTenantIdAndDataReferencia(UUID tenantId, LocalDate dataReferencia);
}
