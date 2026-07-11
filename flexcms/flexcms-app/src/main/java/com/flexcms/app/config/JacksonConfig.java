package com.flexcms.app.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class JacksonConfig {

    @Bean
    ObjectMapper flexCmsObjectMapper() {
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }
}

