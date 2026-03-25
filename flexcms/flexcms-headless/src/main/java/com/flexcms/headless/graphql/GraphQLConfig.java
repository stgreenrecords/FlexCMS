package com.flexcms.headless.graphql;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import graphql.execution.CoercedVariables;
import graphql.language.*;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseValueException;
import graphql.schema.GraphQLScalarType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Registers custom GraphQL scalars used in schema.graphqls.
 *
 * <ul>
 *   <li><b>JSON</b> — passthrough scalar for arbitrary JSON objects/arrays,
 *       backed by Jackson for literal parsing.</li>
 *   <li><b>Long</b> — 64-bit integer scalar (graphql-java built-in).</li>
 * </ul>
 */
@Configuration
public class GraphQLConfig {

    @Autowired
    private ObjectMapper objectMapper;

    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        return wiringBuilder -> wiringBuilder
                .scalar(jsonScalar())
                .scalar(longScalar());
    }

    /**
     * Long scalar: maps GraphQL Long to Java {@code Long}.
     */
    private GraphQLScalarType longScalar() {
        return GraphQLScalarType.newScalar()
                .name("Long")
                .description("A 64-bit signed integer")
                .coercing(new Coercing<Long, Long>() {
                    @Override
                    public Long serialize(Object input, graphql.GraphQLContext ctx, Locale locale) {
                        if (input instanceof Long l) return l;
                        if (input instanceof Number n) return n.longValue();
                        if (input instanceof String s) return Long.parseLong(s);
                        return null;
                    }

                    @Override
                    public Long parseValue(Object input, graphql.GraphQLContext ctx, Locale locale) {
                        if (input instanceof Long l) return l;
                        if (input instanceof Number n) return n.longValue();
                        if (input instanceof String s) return Long.parseLong(s);
                        throw new CoercingParseValueException("Cannot parse Long from: " + input);
                    }

                    @Override
                    public Long parseLiteral(Value<?> input, CoercedVariables vars,
                                            graphql.GraphQLContext ctx, Locale locale) {
                        if (input instanceof IntValue iv) return iv.getValue().longValue();
                        throw new CoercingParseValueException("Cannot parse Long literal from: " + input);
                    }
                })
                .build();
    }

    /**
     * JSON scalar: accepts any JSON-compatible value (Map, List, primitives).
     * Serialization passes the value as-is; literal parsing converts
     * graphql-java AST nodes to their Java equivalents via Jackson.
     */
    private GraphQLScalarType jsonScalar() {
        return GraphQLScalarType.newScalar()
                .name("JSON")
                .description("A JSON scalar — any valid JSON value (object, array, string, number, boolean, null)")
                .coercing(new Coercing<Object, Object>() {

                    @Override
                    public Object serialize(Object dataFetcherResult,
                                           graphql.GraphQLContext graphQLContext,
                                           Locale locale) {
                        return dataFetcherResult; // Map/List/String/Number — pass as-is
                    }

                    @Override
                    public Object parseValue(Object input,
                                            graphql.GraphQLContext graphQLContext,
                                            Locale locale) {
                        if (input instanceof String s) {
                            try {
                                return objectMapper.readValue(s, new TypeReference<Object>() {});
                            } catch (Exception e) {
                                throw new CoercingParseValueException("Invalid JSON string: " + e.getMessage());
                            }
                        }
                        return input;
                    }

                    @Override
                    public Object parseLiteral(Value<?> input,
                                              CoercedVariables variables,
                                              graphql.GraphQLContext graphQLContext,
                                              Locale locale) {
                        return parseLiteralValue(input);
                    }

                    private Object parseLiteralValue(Value<?> input) {
                        if (input instanceof StringValue sv) return sv.getValue();
                        if (input instanceof IntValue iv) return iv.getValue();
                        if (input instanceof FloatValue fv) return fv.getValue();
                        if (input instanceof BooleanValue bv) return bv.isValue();
                        if (input instanceof NullValue) return null;
                        if (input instanceof ObjectValue ov) {
                            Map<String, Object> map = new LinkedHashMap<>();
                            for (ObjectField field : ov.getObjectFields()) {
                                map.put(field.getName(), parseLiteralValue(field.getValue()));
                            }
                            return map;
                        }
                        if (input instanceof ArrayValue av) {
                            return av.getValues().stream().map(this::parseLiteralValue).toList();
                        }
                        return null;
                    }
                })
                .build();
    }
}
