package com.uninassau.demandarecife.sales;

import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import com.uninassau.demandarecife.sales.dto.ImportResult;
import com.uninassau.demandarecife.sales.dto.RawSaleRow;
import com.uninassau.demandarecife.sales.dto.RowError;
import com.uninassau.demandarecife.sales.dto.SaleRequest;
import com.uninassau.demandarecife.sales.importer.SalesImporter;
import com.uninassau.demandarecife.shared.util.TextNormalizer;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SalesService {

    private static final int BATCH_SIZE = 500; // igual ao hibernate.jdbc.batch_size
    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DMY_HM = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final SalesRepository salesRepository;
    private final ProductRepository productRepository;
    private final List<SalesImporter> importers;   // o Spring injeta CSV e Excel
    private final EntityManager entityManager;

    @Transactional
    public SaleTransaction create(UUID tenantId, SaleRequest req) {
        // Isolamento (RNF04): o produto precisa ser do mesmo tenant
        if (!productRepository.existsByIdAndTenantId(req.productId(), tenantId)) {
            throw new IllegalArgumentException("Produto não encontrado");
        }
        var sale = new SaleTransaction();
        sale.setTenantId(tenantId);
        sale.setProductId(req.productId());
        sale.setQuantidade(req.quantidade());
        sale.setPrecoUnitario(req.precoUnitario());
        sale.setDataHoraVenda(req.dataHoraVenda());
        sale.setOrigem("MANUAL");
        return salesRepository.save(sale);
    }

    @Transactional
    public ImportResult importFile(UUID tenantId, MultipartFile file) {
        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("");
        SalesImporter importer = importers.stream()
                .filter(i -> i.supports(filename)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Formato não suportado. Envie .csv ou .xlsx"));

        List<RawSaleRow> rows;
        try (InputStream in = file.getInputStream()) {
            rows = importer.read(in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        // Carrega os produtos do tenant UMA vez (evita 1 SELECT por linha)
        Map<String, Product> bySku = new HashMap<>();
        Map<String, Product> byName = new HashMap<>();
        for (Product p : productRepository.findByTenantId(tenantId)) {
            if (p.getSku() != null && !p.getSku().isBlank()) bySku.put(TextNormalizer.normalize(p.getSku()), p);
            byName.put(TextNormalizer.normalize(p.getNome()), p);
        }

        String origem = filename.toLowerCase().endsWith(".csv") ? "CSV_UPLOAD" : "EXCEL_UPLOAD";
        List<RowError> erros = new ArrayList<>();
        List<SaleTransaction> batch = new ArrayList<>(BATCH_SIZE);
        int importadas = 0;

        for (RawSaleRow row : rows) {
            try {
                Product product = findProduct(row, bySku, byName);
                int qtd = parseQuantity(row.quantidade());
                BigDecimal preco = (row.preco() == null || row.preco().isBlank())
                        ? product.getPrecoVenda()          // sem preço na planilha: usa o do cadastro
                        : parseDecimal(row.preco(), "Preço");
                if (preco == null || preco.signum() <= 0) throw new IllegalArgumentException("Preço inválido");
                LocalDateTime data = parseDate(row.data());

                var sale = new SaleTransaction();
                sale.setTenantId(tenantId);
                sale.setProductId(product.getId());
                sale.setQuantidade(qtd);
                sale.setPrecoUnitario(preco);
                sale.setDataHoraVenda(data);
                sale.setOrigem(origem);
                batch.add(sale);

                if (batch.size() == BATCH_SIZE) { flush(batch); }
                importadas++;
            } catch (IllegalArgumentException | DateTimeParseException e) {
                erros.add(new RowError(row.linha(), e instanceof DateTimeParseException
                        ? "Data inválida (use dd/MM/yyyy ou dd/MM/yyyy HH:mm)" : e.getMessage()));
            }
        }
        if (!batch.isEmpty()) flush(batch);

        return new ImportResult(rows.size(), importadas, erros);
    }

    private void flush(List<SaleTransaction> batch) {
        salesRepository.saveAll(batch);
        salesRepository.flush();
        entityManager.clear();   // libera memória do lote já gravado
        batch.clear();
    }

    private Product findProduct(RawSaleRow row, Map<String, Product> bySku, Map<String, Product> byName) {
        if (row.sku() != null && !row.sku().isBlank()) {
            Product p = bySku.get(TextNormalizer.normalize(row.sku()));
            if (p != null) return p;
        }
        if (row.produto() != null && !row.produto().isBlank()) {
            Product p = byName.get(TextNormalizer.normalize(row.produto()));
            if (p != null) return p;
        }
        throw new IllegalArgumentException("Produto não encontrado (SKU ou nome)");
    }

    private int parseQuantity(String s) {
        try {
            int q = parseDecimal(s, "Quantidade").intValueExact();
            if (q <= 0) throw new IllegalArgumentException("Quantidade deve ser maior que zero");
            return q;
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("Quantidade deve ser um número inteiro");
        }
    }

    private BigDecimal parseDecimal(String s, String campo) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException(campo + " vazio");
        String t = s.trim();
        if (t.contains(",")) t = t.replace(".", "").replace(",", ".");   // 1.234,50 -> 1234.50
        try {
            return new BigDecimal(t);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(campo + " inválido: " + s);
        }
    }

    private LocalDateTime parseDate(String s) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException("Data vazia");
        String t = s.trim();
        LocalDateTime d;
        if (t.contains("/")) {
            d = t.length() <= 10 ? LocalDate.parse(t, DMY).atStartOfDay() : LocalDateTime.parse(t, DMY_HM);
        } else {
            d = t.length() <= 10 ? LocalDate.parse(t).atStartOfDay() : LocalDateTime.parse(t.replace(' ', 'T'));
        }
        if (d.isAfter(LocalDateTime.now())) throw new IllegalArgumentException("Data no futuro");
        return d;
    }
}
