
package com.uninassau.demandarecife.alerts;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
public class OperationalAlertController {

    private final OperationalAlertService service;

    public OperationalAlertController(OperationalAlertService service) {
        this.service = service;
    }

    /**
     * Lista todos os alertas do estabelecimento.
     *
     * GET /api/alerts
     */
    @GetMapping
    public ResponseEntity<List<OperationalAlert>> listar(
            @RequestParam(required = false) String status) {

        return ResponseEntity.ok(service.listarPorStatus(status));
    }

    /**
     * Retorna a quantidade de alertas ativos.
     *
     * GET /api/alerts/count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> contarAtivos() {

        return ResponseEntity.ok(
                Map.of("total", service.contarAtivos())
        );
    }

    /**
     * Retorna a quantidade de alertas não lidos.
     *
     * GET /api/alerts/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> contarNaoLidos() {

        return ResponseEntity.ok(
                Map.of("total", service.contarNaoLidos())
        );
    }

    /**
     * Marca um alerta como lido.
     *
     * PATCH /api/alerts/{id}/read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> marcarComoLido(
            @PathVariable UUID id) {

        boolean atualizado = service.marcarComoLido(id);

        if (!atualizado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "mensagem",
                            "Alerta não encontrado ou já marcado como lido."
                    ));
        }

        return ResponseEntity.ok(
                Map.of("mensagem", "Alerta marcado como lido.")
        );
    }

    /**
     * Resolve um alerta ativo.
     *
     * PATCH /api/alerts/{id}/resolve
     */
    @PatchMapping("/{id}/resolve")
    public ResponseEntity<Map<String, String>> resolver(
            @PathVariable UUID id) {

        boolean resolvido = service.resolver(id);

        if (!resolvido) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "mensagem",
                            "Alerta não encontrado ou já resolvido."
                    ));
        }

        return ResponseEntity.ok(
                Map.of("mensagem", "Alerta resolvido com sucesso.")
        );
    }

    /**
     * Gera alertas operacionais com base no estoque e na previsão de demanda.
     *
     * POST /api/alerts/generate
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Integer>> gerarAlertas() {

        int total = service.gerarAlertas();

        return ResponseEntity.ok(
                Map.of("gerados", total)
        );
    }
}
