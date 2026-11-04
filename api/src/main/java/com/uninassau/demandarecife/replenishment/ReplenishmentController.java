package com.uninassau.demandarecife.replenishment;

import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/replenishment")
@RequiredArgsConstructor
public class ReplenishmentController {

    private final ReplenishmentService service;
    private final CurrentTenant currentTenant;

    // GET /api/replenishment                      -> todos os produtos
    // GET /api/replenishment?apenasComprar=true   -> só o que precisa de pedido hoje
    @GetMapping
    public List<ReplenishmentSuggestion> suggestions(
            @RequestParam(defaultValue = "false") boolean apenasComprar) {
        var todas = service.suggestions(currentTenant.id());
        return apenasComprar ? todas.stream().filter(ReplenishmentSuggestion::comprarAgora).toList() : todas;
    }
}