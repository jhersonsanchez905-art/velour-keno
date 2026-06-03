package com.velour.keno.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Bean
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        // Convertir postgresql:// a jdbc:postgresql://
        String jdbcUrl = databaseUrl.replace("postgresql://", "jdbc:postgresql://");
        properties.setUrl(jdbcUrl);
        return properties;
    }
}