package com.flexcms.dam.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {

    @Value("${flexcms.dam.s3.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${flexcms.dam.s3.access-key:minioadmin}")
    private String accessKey;

    @Value("${flexcms.dam.s3.secret-key:minioadmin}")
    private String secretKey;

    @Value("${flexcms.dam.s3.region:us-east-1}")
    private String region;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region(region)
                .build();
    }
}

