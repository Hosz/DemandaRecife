package com.uninassau.demandarecife.sales.importer;

import com.uninassau.demandarecife.sales.dto.RawSaleRow;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public interface SalesImporter {
    boolean supports(String filename);
    List<RawSaleRow> read(InputStream in) throws IOException;
}
