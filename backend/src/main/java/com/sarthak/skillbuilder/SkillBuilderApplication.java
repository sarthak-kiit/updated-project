package com.sarthak.skillbuilder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SkillBuilderApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkillBuilderApplication.class, args);
    }
}
