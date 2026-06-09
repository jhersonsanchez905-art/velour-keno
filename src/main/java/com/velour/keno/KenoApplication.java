package com.velour.keno;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Slf4j
@SpringBootApplication
public class KenoApplication {

    public static void main(String[] args) {
        SpringApplication.run(KenoApplication.class, args);
        log.info("==============================================");
        log.info("   VELOUR KENO — Números. Poder. Distinción.");
        log.info("   Servidor corriendo en http://localhost:8080");
        log.info("==============================================");
    }
}