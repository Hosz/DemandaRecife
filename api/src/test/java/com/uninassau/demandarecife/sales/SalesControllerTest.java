package com.uninassau.demandarecife.sales;

import com.uninassau.demandarecife.sales.dto.ImportResult;
import com.uninassau.demandarecife.sales.dto.RowError;
import com.uninassau.demandarecife.sales.dto.SaleRequest;
import com.uninassau.demandarecife.shared.exception.ApiExceptionHandler;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SalesControllerTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock SalesService salesService;
    @Mock
    CurrentTenant currentTenant;
    @InjectMocks
    SalesController controller;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
        lenient().when(currentTenant.id()).thenReturn(TENANT);
    }

    private String json(Object quantidade, String data) {
        return """
                {"productId":"%s","quantidade":%s,"precoUnitario":0.80,"dataHoraVenda":"%s"}
                """.formatted(UUID.randomUUID(), quantidade, data);
    }

    @Test
    void postVendaValida_retorna201SemExporCamposInternos() throws Exception {
        var sale = new SaleTransaction();
        sale.setId(UUID.randomUUID());
        sale.setTenantId(TENANT);
        sale.setProductId(UUID.randomUUID());
        sale.setQuantidade(3);
        sale.setPrecoUnitario(new BigDecimal("0.80"));
        sale.setDataHoraVenda(LocalDateTime.of(2025, 10, 27, 9, 0));
        sale.setOrigem("MANUAL");
        when(salesService.create(eq(TENANT), any(SaleRequest.class))).thenReturn(sale);

        mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(json(3, "2025-10-27T09:00:00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantidade").value(3))
                .andExpect(jsonPath("$.origem").value("MANUAL"))
                .andExpect(jsonPath("$.tenantId").doesNotExist());
    }

    @Test
    void postVendaComQuantidadeNegativa_retorna400ComNomeDoCampo() throws Exception {
        mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(json(-1, "2025-10-27T09:00:00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("quantidade")));

        verifyNoInteractions(salesService);
    }

    @Test
    void postVendaComDataNoFuturo_retorna400() throws Exception {
        mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON)
                        .content(json(1, "2999-01-01T00:00:00")))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(salesService);
    }

    @Test
    void postVendaSemCampos_retorna400() throws Exception {
        mvc.perform(post("/api/sales").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadValido_retornaRelatorioDaImportacao() throws Exception {
        var relatorio = new ImportResult(5, 2,
                List.of(new RowError(4, "Produto não encontrado (SKU ou nome)")));
        when(salesService.importFile(eq(TENANT), any())).thenReturn(relatorio);
        var file = new MockMultipartFile("file", "vendas.csv", "text/csv", "conteudo".getBytes());

        mvc.perform(multipart("/api/sales/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalLinhas").value(5))
                .andExpect(jsonPath("$.importadas").value(2))
                .andExpect(jsonPath("$.erros[0].linha").value(4));
    }

    @Test
    void uploadSemArquivo_retorna400() throws Exception {
        mvc.perform(multipart("/api/sales/upload"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(salesService);
    }

    @Test
    void uploadComArquivoVazio_retorna400ComMensagem() throws Exception {
        var vazio = new MockMultipartFile("file", "vazio.csv", "text/csv", new byte[0]);

        mvc.perform(multipart("/api/sales/upload").file(vazio))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Arquivo vazio"));

        verifyNoInteractions(salesService);
    }
}
