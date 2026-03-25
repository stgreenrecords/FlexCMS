package com.flexcms.pim.importer;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for ExcelImportSource.
 */
class ExcelImportSourceTest {

    private final ExcelImportSource source = new ExcelImportSource();
    private final ImportConfig config = new ImportConfig();

    // -------------------------------------------------------------------------
    // getSourceType
    // -------------------------------------------------------------------------

    @Test
    void getSourceType_returnsEXCEL() {
        assertThat(source.getSourceType()).isEqualTo("EXCEL");
    }

    // -------------------------------------------------------------------------
    // parse — happy path
    // -------------------------------------------------------------------------

    @Test
    void parse_basicRows_returnsRecords() throws Exception {
        byte[] xlsx = buildWorkbook(
                new String[]{"sku", "name", "price"},
                new Object[]{"SKU-001", "Widget A", 9.99},
                new Object[]{"SKU-002", "Widget B", 19.99}
        );

        List<Map<String, Object>> records = source.parse(stream(xlsx), config)
                .collect(Collectors.toList());

        assertThat(records).hasSize(2);
        assertThat(records.get(0)).containsEntry("sku", "SKU-001");
        assertThat(records.get(0)).containsEntry("name", "Widget A");
        assertThat(records.get(0)).containsEntry("price", 9.99);
        assertThat(records.get(1)).containsEntry("sku", "SKU-002");
    }

    @Test
    void parse_integerNumbers_returnedAsLong() throws Exception {
        byte[] xlsx = buildWorkbook(
                new String[]{"sku", "stock"},
                new Object[]{"SKU-001", 100.0}
        );

        List<Map<String, Object>> records = source.parse(stream(xlsx), config)
                .collect(Collectors.toList());

        assertThat(records.get(0).get("stock")).isEqualTo(100L);
    }

    @Test
    void parse_booleanCell_returnedAsBoolean() throws Exception {
        byte[] xlsx = buildWorkbook(
                new String[]{"sku", "active"},
                new Object[]{"SKU-001", Boolean.TRUE}
        );

        List<Map<String, Object>> records = source.parse(stream(xlsx), config)
                .collect(Collectors.toList());

        assertThat(records.get(0).get("active")).isEqualTo(Boolean.TRUE);
    }

    @Test
    void parse_emptySheet_returnsEmptyStream() throws Exception {
        byte[] xlsx = buildWorkbook(new String[0]);

        List<Map<String, Object>> records = source.parse(stream(xlsx), config)
                .collect(Collectors.toList());

        assertThat(records).isEmpty();
    }

    @Test
    void parse_headerRowOnly_returnsEmptyStream() throws Exception {
        byte[] xlsx = buildWorkbook(new String[]{"sku", "name"});

        List<Map<String, Object>> records = source.parse(stream(xlsx), config)
                .collect(Collectors.toList());

        assertThat(records).isEmpty();
    }

    @Test
    void parse_blankRowsSkipped() throws Exception {
        // Build a workbook with a blank row between data rows
        XSSFWorkbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet();
        createRow(sheet, 0, new String[]{"sku", "name"});
        createRow(sheet, 1, new Object[]{"SKU-001", "A"});
        // row 2 intentionally left blank
        createRow(sheet, 3, new Object[]{"SKU-002", "B"});
        byte[] bytes = toBytes(wb);

        List<Map<String, Object>> records = source.parse(stream(bytes), config)
                .collect(Collectors.toList());

        assertThat(records).hasSize(2);
    }

    @Test
    void parse_emptyCellsOmittedFromRecord() throws Exception {
        byte[] xlsx = buildWorkbook(
                new String[]{"sku", "name", "desc"},
                new Object[]{"SKU-001", "Widget", ""}
        );

        Map<String, Object> record = source.parse(stream(xlsx), config)
                .findFirst().orElseThrow();

        assertThat(record).containsKeys("sku", "name");
        assertThat(record).doesNotContainKey("desc");
    }

    @Test
    void parse_headersTrimmed() throws Exception {
        byte[] xlsx = buildWorkbook(
                new String[]{"  sku  ", " name "},
                new Object[]{"SKU-001", "Widget"}
        );

        Map<String, Object> record = source.parse(stream(xlsx), config)
                .findFirst().orElseThrow();

        assertThat(record).containsKey("sku");
        assertThat(record).containsKey("name");
    }

    @Test
    void parse_invalidStream_throwsRuntimeException() {
        byte[] garbage = "not an excel file".getBytes();

        assertThatThrownBy(() -> source.parse(stream(garbage), config).count())
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to parse Excel file");
    }

    // -------------------------------------------------------------------------
    // inferSchema
    // -------------------------------------------------------------------------

    @Test
    void inferSchema_buildsSchemaFromHeaders() throws Exception {
        byte[] xlsx = buildWorkbook(
                new String[]{"sku", "price", "active"},
                new Object[]{"SKU-001", 9.99, Boolean.TRUE}
        );

        Map<String, Object> schema = source.inferSchema(stream(xlsx), config);

        assertThat(schema).containsKey("properties");
        @SuppressWarnings("unchecked")
        Map<String, Object> props = (Map<String, Object>) schema.get("properties");
        assertThat(props).containsKey("sku");
        assertThat(props).containsKey("price");
        assertThat(props).containsKey("active");

        @SuppressWarnings("unchecked")
        Map<String, Object> priceProp = (Map<String, Object>) props.get("price");
        assertThat(priceProp.get("type")).isEqualTo("number");

        @SuppressWarnings("unchecked")
        Map<String, Object> activeProp = (Map<String, Object>) props.get("active");
        assertThat(activeProp.get("type")).isEqualTo("boolean");
    }

    @Test
    void inferSchema_emptySheet_returnsEmptyMap() throws Exception {
        byte[] xlsx = buildWorkbook(new String[0]);

        Map<String, Object> schema = source.inferSchema(stream(xlsx), config);

        assertThat(schema).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private byte[] buildWorkbook(String[] headers, Object[]... dataRows) throws Exception {
        XSSFWorkbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet();
        if (headers.length > 0) {
            createRow(sheet, 0, headers);
        }
        for (int i = 0; i < dataRows.length; i++) {
            createRow(sheet, i + 1, dataRows[i]);
        }
        return toBytes(wb);
    }

    private void createRow(Sheet sheet, int rowNum, Object[] values) {
        Row row = sheet.createRow(rowNum);
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            Object val = values[i];
            if (val instanceof String s) cell.setCellValue(s);
            else if (val instanceof Double d) cell.setCellValue(d);
            else if (val instanceof Boolean b) cell.setCellValue(b);
            else if (val != null) cell.setCellValue(val.toString());
        }
    }

    private byte[] toBytes(XSSFWorkbook wb) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        wb.write(bos);
        wb.close();
        return bos.toByteArray();
    }

    private ByteArrayInputStream stream(byte[] bytes) {
        return new ByteArrayInputStream(bytes);
    }
}
