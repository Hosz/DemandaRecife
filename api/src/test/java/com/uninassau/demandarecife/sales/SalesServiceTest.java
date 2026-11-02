package com.uninassau.demandarecife.sales;

import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import com.uninassau.demandarecife.sales.dto.RowError;
import com.uninassau.demandarecife.sales.dto.SaleRequest;
import com.uninassau.demandarecife.sales.importer.CsvSalesImporter;
import com.uninassau.demandarecife.sales.importer.ExcelSalesImporter;
import jakarta.persistence.EntityManager;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalesServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String HEADER = "sku;produto;quantidade;preco;data\n";

    @Mock SalesRepository salesRepository;
    @Mock
    ProductRepository productRepository;
    @Mock
    EntityManager entityManager;

    SalesService service;
    List<SaleTransaction> saved;

    @BeforeEach
    void setUp() {
        // importadores REAIS: assim o teste cobre leitura + validação juntas
        service = new SalesService(salesRepository, productRepository,
                List.of(new CsvSalesImporter(), new ExcelSalesImporter()), entityManager);

        // O service limpa a lista depois do saveAll (batch.clear()),
        // então copiamos o conteúdo NO MOMENTO da chamada.
        saved = new ArrayList<>();
        lenient().when(salesRepository.saveAll(any())).thenAnswer(inv -> {
            Iterable<SaleTransaction> it = inv.getArgument(0);
            it.forEach(saved::add);
            return List.of();
        });
    }

    // ---------- helpers ----------

    private Product product(String nome, String sku, String precoVenda) {
        var p = new Product();
        p.setId(UUID.randomUUID());
        p.setTenantId(TENANT);
        p.setNome(nome);
        p.setSku(sku);
        p.setPrecoVenda(precoVenda == null ? null : new BigDecimal(precoVenda));
        return p;
    }

    private void catalogo(Product... products) {
        when(productRepository.findByTenantId(TENANT)).thenReturn(List.of(products));
    }

    private MockMultipartFile csv(String content) {
        return new MockMultipartFile("file", "vendas.csv", "text/csv",
                content.getBytes(StandardCharsets.UTF_8));
    }

    // ---------- create (venda manual) ----------

    @Test
    void create_gravaVendaManualComTenantCorreto() {
        UUID productId = UUID.randomUUID();
        when(productRepository.existsByIdAndTenantId(productId, TENANT)).thenReturn(true);
        when(salesRepository.save(any(SaleTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        var req = new SaleRequest(productId, 3, new BigDecimal("0.80"), LocalDateTime.of(2025, 10, 27, 9, 0));

        var sale = service.create(TENANT, req);

        assertThat(sale.getTenantId()).isEqualTo(TENANT);
        assertThat(sale.getProductId()).isEqualTo(productId);
        assertThat(sale.getQuantidade()).isEqualTo(3);
        assertThat(sale.getOrigem()).isEqualTo("MANUAL");
    }

    @Test
    void create_recusaProdutoDeOutroTenant() {
        when(productRepository.existsByIdAndTenantId(any(), eq(TENANT))).thenReturn(false);
        var req = new SaleRequest(UUID.randomUUID(), 1, BigDecimal.ONE, LocalDateTime.of(2025, 10, 27, 9, 0));

        assertThatThrownBy(() -> service.create(TENANT, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Produto não encontrado");
        verify(salesRepository, never()).save(any());
    }

    // ---------- importFile: caminhos felizes ----------

    @Test
    void importFile_encontraProdutoPorSkuSemDiferenciarMaiusculas() {
        var pao = product("Pão Francês", "PAO-001", "0.80");
        catalogo(pao);

        var result = service.importFile(TENANT, csv(HEADER + "pao-001;;50;0,80;27/10/2025\n"));

        assertThat(result.importadas()).isEqualTo(1);
        assertThat(saved).singleElement().satisfies(s -> {
            assertThat(s.getProductId()).isEqualTo(pao.getId());
            assertThat(s.getTenantId()).isEqualTo(TENANT);
            assertThat(s.getQuantidade()).isEqualTo(50);
            assertThat(s.getOrigem()).isEqualTo("CSV_UPLOAD");
        });
    }

    @Test
    void importFile_encontraProdutoPorNomeSemAcentoENaoDiferenciaMaiusculas() {
        var pao = product("Pão Francês", null, "0.80");
        catalogo(pao);

        service.importFile(TENANT, csv(HEADER + ";PAO FRANCES;10;0,80;27/10/2025\n"));

        assertThat(saved).singleElement()
                .satisfies(s -> assertThat(s.getProductId()).isEqualTo(pao.getId()));
    }

    @Test
    void importFile_seSkuNaoExisteTentaPeloNome() {
        var pao = product("Pão Francês", "PAO-001", "0.80");
        catalogo(pao);

        var result = service.importFile(TENANT, csv(HEADER + "SKU-ERRADO;Pão Francês;1;0,80;27/10/2025\n"));

        assertThat(result.importadas()).isEqualTo(1);
        assertThat(saved).singleElement()
                .satisfies(s -> assertThat(s.getProductId()).isEqualTo(pao.getId()));
    }

    @Test
    void importFile_semPrecoUsaPrecoDoCadastro() {
        catalogo(product("Pão Francês", "PAO-001", "0.80"));

        service.importFile(TENANT, csv(HEADER + "PAO-001;;5;;27/10/2025\n"));

        assertThat(saved).singleElement()
                .satisfies(s -> assertThat(s.getPrecoUnitario()).isEqualByComparingTo("0.80"));
    }

    @Test
    void importFile_entendePrecoBrasileiroComMilhar() {
        catalogo(product("Bolo", "BOL-001", "10.00"));

        service.importFile(TENANT, csv(HEADER + "BOL-001;;1;1.234,50;27/10/2025\n"));

        assertThat(saved).singleElement()
                .satisfies(s -> assertThat(s.getPrecoUnitario()).isEqualByComparingTo("1234.50"));
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource(delimiter = '|', value = {
            "27/10/2025 08:30|2025-10-27T08:30:00",
            "27/10/2025|2025-10-27T00:00:00",
            "2025-10-27|2025-10-27T00:00:00",
            "2025-10-27T08:30:00|2025-10-27T08:30:00",
            "2025-10-27 08:30|2025-10-27T08:30:00"
    })
    void importFile_aceitaVariosFormatosDeData(String entrada, String esperado) {
        catalogo(product("Pão Francês", "PAO-001", "0.80"));

        service.importFile(TENANT, csv(HEADER + "PAO-001;;1;0,80;" + entrada + "\n"));

        assertThat(saved).singleElement()
                .satisfies(s -> assertThat(s.getDataHoraVenda()).isEqualTo(LocalDateTime.parse(esperado)));
    }

    @Test
    void importFile_aceitaExcelEMarcaOrigem() throws Exception {
        catalogo(product("Pão Francês", "PAO-001", "0.80"));
        byte[] bytes;
        try (var wb = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet();
            Row h = sheet.createRow(0);
            String[] cols = {"sku", "produto", "quantidade", "preco", "data"};
            for (int i = 0; i < cols.length; i++) h.createCell(i).setCellValue(cols[i]);
            Row r = sheet.createRow(1);
            r.createCell(0).setCellValue("PAO-001");
            r.createCell(2).setCellValue(7);
            r.createCell(4).setCellValue("27/10/2025");
            wb.write(out);
            bytes = out.toByteArray();
        }
        var file = new MockMultipartFile("file", "vendas.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        var result = service.importFile(TENANT, file);

        assertThat(result.importadas()).isEqualTo(1);
        assertThat(saved).singleElement().satisfies(s -> {
            assertThat(s.getOrigem()).isEqualTo("EXCEL_UPLOAD");
            assertThat(s.getQuantidade()).isEqualTo(7);
            assertThat(s.getPrecoUnitario()).isEqualByComparingTo("0.80");
        });
    }

    // ---------- importFile: erros por linha ----------

    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', value = {
            "produto inexistente|;Bolo X;1;5,00;27/10/2025|Produto não encontrado (SKU ou nome)",
            "sem sku e sem nome|;;1;5,00;27/10/2025|Produto não encontrado (SKU ou nome)",
            "quantidade zero|PAO-001;;0;0,80;27/10/2025|Quantidade deve ser maior que zero",
            "quantidade negativa|PAO-001;;-3;0,80;27/10/2025|Quantidade deve ser maior que zero",
            "quantidade decimal|PAO-001;;2,5;0,80;27/10/2025|Quantidade deve ser um número inteiro",
            "quantidade texto|PAO-001;;abc;0,80;27/10/2025|Quantidade inválida: abc",
            "quantidade vazia|PAO-001;;;0,80;27/10/2025|Quantidade vazio",
            "preço zero|PAO-001;;1;0;27/10/2025|Preço inválido",
            "preço texto|PAO-001;;1;abc;27/10/2025|Preço inválido: abc",
            "data inválida|PAO-001;;1;0,80;32/10/2025|Data inválida (use dd/MM/yyyy ou dd/MM/yyyy HH:mm)",
            "data vazia|PAO-001;;1;0,80;|Data vazia",
            "data no futuro|PAO-001;;1;0,80;01/01/2999|Data no futuro"
    })
    void importFile_rejeitaLinhaInvalidaComMotivoClaro(String caso, String linha, String motivo) {
        catalogo(product("Pão Francês", "PAO-001", "0.80"));

        var result = service.importFile(TENANT, csv(HEADER + linha + "\n"));

        assertThat(result.importadas()).isZero();
        assertThat(result.erros()).singleElement().satisfies(e -> {
            assertThat(e.linha()).isEqualTo(2);
            assertThat(e.motivo()).isEqualTo(motivo);
        });
        verify(salesRepository, never()).saveAll(any());
    }

    @Test
    void importFile_linhasRuinsNaoDerrubamAsBoas() {
        catalogo(product("Pão Francês", "PAO-001", "0.80"));

        var result = service.importFile(TENANT, csv(HEADER + """
                PAO-001;Pão Francês;50;0,80;27/10/2025 08:30
                ;pao frances;10;;27/10/2025
                ;Bolo Inexistente;2;5,00;27/10/2025
                PAO-001;Pão Francês;0;0,80;27/10/2025
                PAO-001;Pão Francês;5;0,80;32/10/2025
                """));

        assertThat(result.totalLinhas()).isEqualTo(5);
        assertThat(result.importadas()).isEqualTo(2);
        assertThat(result.erros()).extracting(RowError::linha).containsExactly(4, 5, 6);
        assertThat(saved).hasSize(2);
        assertThat(saved.get(1).getPrecoUnitario()).isEqualByComparingTo("0.80");
    }

    // ---------- importFile: arquivo ----------

    @Test
    void importFile_recusaFormatoNaoSuportado() {
        var file = new MockMultipartFile("file", "vendas.txt", "text/plain", "x".getBytes());

        assertThatThrownBy(() -> service.importFile(TENANT, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Formato não suportado. Envie .csv ou .xlsx");
    }

    // ---------- importFile: performance (lote) ----------

    @Test
    void importFile_gravaEmLotesDe500ELimpaMemoria() {
        catalogo(product("Pão Francês", "PAO-001", "0.80"));
        var sb = new StringBuilder(HEADER);
        for (int i = 0; i < 1200; i++) sb.append("PAO-001;;1;0,80;27/10/2025\n");

        var result = service.importFile(TENANT, csv(sb.toString()));

        assertThat(result.importadas()).isEqualTo(1200);
        assertThat(saved).hasSize(1200);
        verify(salesRepository, times(3)).saveAll(any());   // 500 + 500 + 200
        verify(entityManager, times(3)).clear();
        verify(productRepository, times(1)).findByTenantId(TENANT); // 1 consulta, não 1200
    }
}
