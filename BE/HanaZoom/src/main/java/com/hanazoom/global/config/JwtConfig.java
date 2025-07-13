package com.hanazoom.global.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret = "hanazoom-secret-key-for-jwt-token-generation-and-validation-2024";
    private long accessTokenExpiration = 3600000; // 1시간 (밀리초)
    private long refreshTokenExpiration = 2592000000L; // 30일 (밀리초)
    private String issuer = "HanaZoom";
}