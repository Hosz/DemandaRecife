package com.uninassau.demandarecife.sales.importer;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;

class ExcelSalesImporterTest {

    private final ExcelSalesImporter importer = new ExcelSalesImporter();

    private byte[] xlsx(Consumer<Workbook> fill) throws IOException {
        try (var wb = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            fill.accept(wb);
            wb.write(out);
            return out.toByteArray();
        }
    }

    private void header(Sheet sheet) {
        Row h = sheet.createRow(0);
        String[] cols = {"sku", "produto", "quantidade", "preco", "data"};
        for (int i = 0; i < cols.length; i++) h.createCell(i).setCellValue(cols[i]);
    }

    @Test
    void reconheceXlsxEXls() {
        assertThat(importer.supports("vendas.xlsx")).isTrue();
        assertThat(importer.supports("VENDAS.XLS")).isTrue();
        assertThat(importer.supports("vendas.csv")).isFalse();
    }

    @Test
    void leTextoNumerosEDataReal() throws IOException {
        byte[] file = xlsx(wb -> {
            Sheet sheet = wb.createSheet();
            header(sheet);
            Row r = sheet.createRow(1);
            r.createCell(0).setCellValue("PAO-001");
            r.createCell(1).setCellValue("Pão Francês");
            r.createCell(2).setCellValue(50);
            r.createCell(3).setCellValue(0.8);
            Cell data = r.createCell(4);
            data.setCellValue(LocalDateTime.of(2025, 10, 27, 8, 30));
            CellStyle style = wb.createCellStyle();
            style.setDataFormat(wb.getCreationHelper().createDataFormat().getFormat("dd/mm/yyyy hh:mm"));
            data.setCellStyle(style);
        });

        var rows = importer.read(new ByteArrayInputStream(file));

        assertThat(rows).singleElement().satisfies(r -> {
            assertThat(r.linha()).isEqualTo(2);
            assertThat(r.sku()).isEqualTo("PAO-001");
            assertThat(r.quantidade()).isEqualTo("50");
            assertThat(r.preco()).isEqualTo("0.8");
            assertThat(r.data()).isEqualTo("2025-10-27T08:30");
        });
    }

    @Test
    void celulaVaziaViraNulo() throws IOException {
        byte[] file = xlsx(wb -> {
            Sheet sheet = wb.createSheet();
            header(sheet);
            Row r = sheet.createRow(1);
            r.createCell(1).setCellValue("Pão");
            r.createCell(2).setCellValue(3);
        });

        var rows = importer.read(new ByteArrayInputStream(file));

        assertThat(rows).singleElement().satisfies(r -> {
            assertThat(r.sku()).isNull();
            assertThat(r.preco()).isNull();
            assertThat(r.produto()).isEqualTo("Pão");
        });
    }

    @Test
    void planilhaSemCabecalhoRetornaVazio() throws IOException {
        byte[] file = xlsx(wb -> wb.createSheet());

        assertThat(importer.read(new ByteArrayInputStream(file))).isEmpty();
    }
}
