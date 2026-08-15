package com.embos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EmbosApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmbosApplication.class, args);
    }
}
