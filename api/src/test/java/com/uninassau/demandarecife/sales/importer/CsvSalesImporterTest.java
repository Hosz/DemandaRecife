package com.uninassau.demandarecife.sales.importer;

import com.uninassau.demandarecife.sales.dto.RawSaleRow;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvSalesImporterTest {

    private final CsvSalesImporter importer = new CsvSalesImporter();

    private List<RawSaleRow> read(String csv) throws IOException {
        return importer.read(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void reconheceCsvPelaExtensao() {
        assertThat(importer.supports("Vendas.CSV")).isTrue();
        assertThat(importer.supports("vendas.xlsx")).isFalse();
    }

    @Test
    void lePontoEVirgulaEGuardaNumeroDaLinha() throws IOException {
        var rows = read("""
                sku;produto;quantidade;preco;data
                PAO-001;Pão Francês;50;0,80;27/10/2025 08:30
                ;pao frances;10;;27/10/2025
                """);

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0)).isEqualTo(
                new RawSaleRow(2, "PAO-001", "Pão Francês", "50", "0,80", "27/10/2025 08:30"));
        assertThat(rows.get(1).linha()).isEqualTo(3);
        assertThat(rows.get(1).sku()).isNullOrEmpty();
        assertThat(rows.get(1).preco()).isNullOrEmpty();
    }

    @Test
    void leVirgulaComoSeparador() throws IOException {
        var rows = read("sku,produto,quantidade,preco,data\nPAO-001,Pão,5,0.80,27/10/2025\n");

        assertThat(rows).singleElement().satisfies(r -> {
            assertThat(r.sku()).isEqualTo("PAO-001");
            assertThat(r.quantidade()).isEqualTo("5");
        });
    }

    @Test
    void ignoraBomDoExcel() throws IOException {
        var rows = read("\uFEFFsku;produto;quantidade;preco;data\nPAO-001;Pão;1;1;27/10/2025\n");

        assertThat(rows).singleElement()
                .satisfies(r -> assertThat(r.sku()).isEqualTo("PAO-001"));
    }

    @Test
    void cabecalhoNaoDiferenciaMaiusculas() throws IOException {
        var rows = read("SKU;Produto;QUANTIDADE;Preco;DATA\nPAO-001;Pão;1;1;27/10/2025\n");

        assertThat(rows).singleElement()
                .satisfies(r -> assertThat(r.produto()).isEqualTo("Pão"));
    }

    @Test
    void colunasOpcionaisAusentesViramNulo() throws IOException {
        var rows = read("produto;quantidade;data\nPão;5;27/10/2025\n");

        assertThat(rows).singleElement().satisfies(r -> {
            assertThat(r.sku()).isNull();
            assertThat(r.preco()).isNull();
            assertThat(r.produto()).isEqualTo("Pão");
        });
    }

    @Test
    void ignoraLinhasEmBranco() throws IOException {
        var rows = read("sku;produto;quantidade;preco;data\n\nPAO-001;Pão;1;1;27/10/2025\n\n");

        assertThat(rows).hasSize(1);
    }
}
