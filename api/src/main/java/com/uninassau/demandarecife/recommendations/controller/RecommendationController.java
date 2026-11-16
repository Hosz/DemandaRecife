package com.uninassau.demandarecife.recommendations.controller;

import com.uninassau.demandarecife.recommendations.dto.AiRecommendationDto;
import com.uninassau.demandarecife.recommendations.service.RecommendationOrchestratorService;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationOrchestratorService orchestrator;
    private final CurrentTenant currentTenant;

    @GetMapping("/daily")
    public ResponseEntity<List<AiRecommendationDto>> getDaily() {
        return ResponseEntity.ok(orchestrator.getDailyRecommendations(currentTenant.id(), null));
    }

    @PostMapping("/regenerate")
    public ResponseEntity<List<AiRecommendationDto>> regenerate() {
        return ResponseEntity.ok(orchestrator.regenerateDailyRecommendations(currentTenant.id(), null));
    }

    @PatchMapping("/{id}/apply")
    public ResponseEntity<AiRecommendationDto> apply(@PathVariable UUID id) {
        return ResponseEntity.ok(orchestrator.applyRecommendation(currentTenant.id(), id));
    }

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<AiRecommendationDto> dismiss(@PathVariable UUID id) {
        return ResponseEntity.ok(orchestrator.dismissRecommendation(currentTenant.id(), id));
    }
}
