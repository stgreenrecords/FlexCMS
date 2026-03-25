package com.flexcms.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ComponentScan(basePackages = "com.flexcms")
@EnableElasticsearchRepositories(basePackages = "com.flexcms.search.repository")
@EnableAsync
@EnableScheduling
public class FlexCmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlexCmsApplication.class, args);
    }
}
