package com.flexcms.pim.importer;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * Excel (.xlsx) import source — parses the first sheet of an XLSX workbook
 * into raw product records.
 *
 * <p>The first non-empty row is treated as the header row; each subsequent
 * row becomes one product record.  Cells are coerced to their natural Java
 * type (String, Double, Boolean) so that numeric and boolean columns survive
 * the pipeline without being stringified unnecessarily.</p>
 */
@Component
public class ExcelImportSource implements ProductImportSource {

    @Override
    public String getSourceType() {
        return "EXCEL";
    }

    @Override
    public Stream<Map<String, Object>> parse(InputStream input, ImportConfig config) {
        try {
            Workbook workbook = new XSSFWorkbook(input);
            Sheet sheet = workbook.getSheetAt(0);

            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                workbook.close();
                return Stream.empty();
            }

            // First row → headers
            String[] headers = readHeaders(rowIterator.next());

            List<Map<String, Object>> records = new ArrayList<>();
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                if (isBlankRow(row)) continue;
                Map<String, Object> record = readRow(row, headers);
                if (!record.isEmpty()) {
                    records.add(record);
                }
            }

            workbook.close();
            return records.stream();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
    }

    @Override
    public Map<String, Object> inferSchema(InputStream input, ImportConfig config) {
        try {
            Workbook workbook = new XSSFWorkbook(input);
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            if (!rowIterator.hasNext()) {
                workbook.close();
                return Map.of();
            }

            String[] headers = readHeaders(rowIterator.next());

            // Peek at the first data row to infer types
            Map<String, String> inferredTypes = new LinkedHashMap<>();
            if (rowIterator.hasNext()) {
                Row dataRow = rowIterator.next();
                for (int i = 0; i < headers.length; i++) {
                    if (headers[i].isEmpty()) continue;
                    Cell cell = dataRow.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    inferredTypes.put(headers[i], inferCellType(cell));
                }
            } else {
                for (String h : headers) {
                    if (!h.isEmpty()) inferredTypes.put(h, "string");
                }
            }

            Map<String, Object> properties = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : inferredTypes.entrySet()) {
                properties.put(entry.getKey(), Map.of(
                        "type", entry.getValue(),
                        "label", entry.getKey()
                ));
            }

            workbook.close();
            return Map.of(
                    "$schema", "http://json-schema.org/draft-07/schema#",
                    "type", "object",
                    "properties", properties
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to infer schema from Excel file", e);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String[] readHeaders(Row row) {
        int lastCell = row.getLastCellNum();
        String[] headers = new String[lastCell];
        for (int i = 0; i < lastCell; i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            headers[i] = cell != null ? cell.getStringCellValue().trim() : "";
        }
        return headers;
    }

    private Map<String, Object> readRow(Row row, String[] headers) {
        Map<String, Object> record = new LinkedHashMap<>();
        for (int i = 0; i < headers.length; i++) {
            if (headers[i].isEmpty()) continue;
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell == null) continue;
            Object value = cellValue(cell);
            if (value != null && !value.toString().isEmpty()) {
                record.put(headers[i], value);
            }
        }
        return record;
    }

    private Object cellValue(Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double d = cell.getNumericCellValue();
                // Return as long if it's a whole number, else as double
                if (d == Math.floor(d) && !Double.isInfinite(d)) {
                    yield Long.valueOf((long) d);
                }
                yield Double.valueOf(d);
            }
            case BOOLEAN -> cell.getBooleanCellValue();
            case FORMULA -> evaluateFormulaCell(cell);
            default -> null;
        };
    }

    private Object evaluateFormulaCell(Cell cell) {
        // Best-effort: use cached value
        return switch (cell.getCachedFormulaResultType()) {
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                if (d == Math.floor(d) && !Double.isInfinite(d)) {
                    yield Long.valueOf((long) d);
                }
                yield Double.valueOf(d);
            }
            case BOOLEAN -> cell.getBooleanCellValue();
            default -> cell.getStringCellValue().trim();
        };
    }

    private boolean isBlankRow(Row row) {
        if (row == null) return true;
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private String inferCellType(Cell cell) {
        if (cell == null) return "string";
        return switch (cell.getCellType()) {
            case NUMERIC -> DateUtil.isCellDateFormatted(cell) ? "string" : "number";
            case BOOLEAN -> "boolean";
            default -> "string";
        };
    }
}
