package com.uninassau.demandarecife.sales.controller;

import com.uninassau.demandarecife.sales.service.SalesService;
import com.uninassau.demandarecife.sales.dto.ImportResult;
import com.uninassau.demandarecife.sales.dto.SaleRequest;
import com.uninassau.demandarecife.sales.dto.SaleResponse;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;
    private final CurrentTenant currentTenant; // a definir

    @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest req) {
        var saved = salesService.create(currentTenant.id(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(SaleResponse.from(saved));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResult upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("O arquivo excede o limite máximo permitido de 10MB");
        }
        String filename = file.getOriginalFilename();
        if (filename != null && (filename.contains("..") || filename.contains("/") || filename.contains("\\"))) {
            throw new IllegalArgumentException("Nome de arquivo inválido ou inseguro");
        }
        return salesService.importFile(currentTenant.id(), file);
    }
}