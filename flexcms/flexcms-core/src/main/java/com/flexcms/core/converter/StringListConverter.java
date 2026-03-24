package com.flexcms.core.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * JPA converter for PostgreSQL {@code text[]} columns.
 *
 * <p>Serialises a {@code List<String>} to the PostgreSQL array literal format
 * {@code {READ,WRITE,DELETE}} and deserialises back.
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "{}";
        }
        return "{" + String.join(",", list) + "}";
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank() || dbData.equals("{}")) {
            return new ArrayList<>();
        }
        // Strip surrounding braces: {READ,WRITE} → READ,WRITE
        String inner = dbData.replaceAll("^\\{|\\}$", "");
        return new ArrayList<>(Arrays.asList(inner.split(",")));
    }
}
