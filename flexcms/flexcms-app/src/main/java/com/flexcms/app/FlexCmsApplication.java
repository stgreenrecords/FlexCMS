package com.flexcms.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@ComponentScan(basePackages = "com.flexcms")
@EntityScan(basePackages = "com.flexcms")
@EnableJpaRepositories(basePackages = "com.flexcms")
@EnableAsync
public class FlexCmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlexCmsApplication.class, args);
    }
}

