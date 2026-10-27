package com.uninassau.demandarecife.sales.importer;

import com.uninassau.demandarecife.sales.dto.RawSaleRow;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ExcelSalesImporter implements SalesImporter {

    private final DataFormatter formatter = new DataFormatter();

    @Override
    public boolean supports(String filename) {
        String f = filename.toLowerCase();
        return f.endsWith(".xlsx") || f.endsWith(".xls");
    }

    @Override
    public List<RawSaleRow> read(InputStream in) throws IOException {
        try (Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = wb.getSheetAt(0);
            Row header = sheet.getRow(0);
            if (header == null) return List.of();

            Map<String, Integer> cols = new HashMap<>();
            for (Cell c : header) {
                cols.put(formatter.formatCellValue(c).trim().toLowerCase(), c.getColumnIndex());
            }

            List<RawSaleRow> rows = new ArrayList<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row r = sheet.getRow(i);
                if (r == null) continue;
                rows.add(new RawSaleRow(i + 1,
                        text(r, cols, "sku"), text(r, cols, "produto"),
                        text(r, cols, "quantidade"), text(r, cols, "preco"),
                        text(r, cols, "data")));
            }
            return rows;
        }
    }

    private String text(Row r, Map<String, Integer> cols, String col) {
        Integer idx = cols.get(col);
        if (idx == null) return null;
        Cell c = r.getCell(idx);
        if (c == null) return null;

        if (c.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(c)) return c.getLocalDateTimeCellValue().toString();
            return BigDecimal.valueOf(c.getNumericCellValue()).stripTrailingZeros().toPlainString();
        }
        String s = formatter.formatCellValue(c).trim();
        return s.isEmpty() ? null : s;
    }
}
