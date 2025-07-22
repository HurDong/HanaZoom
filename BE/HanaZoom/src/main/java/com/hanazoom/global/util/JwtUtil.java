package com.hanazoom.global.util;

import com.hanazoom.global.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtConfig jwtConfig;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes());
    }

    public String generateAccessToken(UUID memberId, String email) {
        return generateToken(memberId, email, jwtConfig.getAccessTokenExpiration());
    }

    public String generateRefreshToken(UUID memberId, String email) {
        return generateToken(memberId, email, jwtConfig.getRefreshTokenExpiration());
    }

    private String generateToken(UUID memberId, String email, long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(memberId.toString())
                .claim("email", email)
                .setIssuer(jwtConfig.getIssuer())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            log.warn("JWT 토큰이 만료되었습니다: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            log.error("지원하지 않는 JWT 토큰입니다: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            log.error("잘못된 JWT 토큰입니다: {}", e.getMessage());
            throw e;
        } catch (SecurityException e) {
            log.error("JWT 토큰 서명이 유효하지 않습니다: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("JWT 토큰이 비어있습니다: {}", e.getMessage());
            throw e;
        }
    }

    public UUID getMemberIdFromToken(String token) {
        Claims claims = parseToken(token);
        return UUID.fromString(claims.getSubject());
    }

    public String getEmailFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("email", String.class);
    }

    public boolean isTokenExpired(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}