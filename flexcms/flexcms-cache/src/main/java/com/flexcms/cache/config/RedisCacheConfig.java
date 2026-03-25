package com.flexcms.cache.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
@ConditionalOnProperty(name = "flexcms.cache.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RedisCacheConfig {

    @Primary
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(mapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer)
                )
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = Map.ofEntries(
                Map.entry("content-nodes", defaultConfig.entryTtl(Duration.ofHours(1))),
                Map.entry("page-renders", defaultConfig.entryTtl(Duration.ofMinutes(30))),
                Map.entry("headless-pages", defaultConfig.entryTtl(Duration.ofMinutes(5))),
                Map.entry("navigation", defaultConfig.entryTtl(Duration.ofHours(1))),
                Map.entry("component-models", defaultConfig.entryTtl(Duration.ofMinutes(30))),
                Map.entry("site-resolution", defaultConfig.entryTtl(Duration.ofHours(24))),
                Map.entry("dam-metadata", defaultConfig.entryTtl(Duration.ofHours(1))),
                Map.entry("search-results", defaultConfig.entryTtl(Duration.ofMinutes(5))),
                Map.entry("i18n", defaultConfig.entryTtl(Duration.ofHours(24))),
                Map.entry("external-api", defaultConfig.entryTtl(Duration.ofMinutes(15)))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}

