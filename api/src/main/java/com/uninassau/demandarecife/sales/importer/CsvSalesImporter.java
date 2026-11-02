package com.uninassau.demandarecife.sales.importer;

import com.uninassau.demandarecife.sales.dto.RawSaleRow;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class CsvSalesImporter implements SalesImporter {

    @Override
    public boolean supports(String filename) {
        return filename.toLowerCase().endsWith(".csv");
    }

    @Override
    public List<RawSaleRow> read(InputStream in) throws IOException {
        var reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));

        reader.mark(1);                                  // ignora BOM do Excel
        if (reader.read() != 0xFEFF) reader.reset();

        reader.mark(8192);                               // detecta ; ou ,
        String first = reader.readLine();
        reader.reset();
        char delimiter = (first != null && first.contains(";")) ? ';' : ',';

        var format = CSVFormat.DEFAULT.builder()
                .setDelimiter(delimiter)
                .setHeader().setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true).setIgnoreEmptyLines(true)
                .get();

        List<RawSaleRow> rows = new ArrayList<>();
        try (CSVParser parser = format.parse(reader)) {
            for (CSVRecord r : parser) {
                rows.add(new RawSaleRow(
                        (int) r.getRecordNumber() + 1,   // +1 por causa do cabeçalho
                        value(r, "sku"), value(r, "produto"),
                        value(r, "quantidade"), value(r, "preco"), value(r, "data")));
            }
        }
        return rows;
    }

    private String value(CSVRecord r, String col) {
        return r.isMapped(col) && r.isSet(col) ? r.get(col) : null;
    }
}
