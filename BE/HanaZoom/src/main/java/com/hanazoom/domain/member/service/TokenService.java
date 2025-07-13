package com.hanazoom.service;

import java.util.UUID;

public interface TokenService {

    /**
     * Access Token을 Redis에 저장
     */
    void saveAccessToken(UUID memberId, String accessToken);

    /**
     * Refresh Token을 Redis에 저장
     */
    void saveRefreshToken(UUID memberId, String refreshToken);

    /**
     * Access Token이 유효한지 확인
     */
    boolean isValidAccessToken(UUID memberId, String accessToken);

    /**
     * Refresh Token이 유효한지 확인
     */
    boolean isValidRefreshToken(UUID memberId, String refreshToken);

    /**
     * 사용자의 모든 토큰을 삭제 (로그아웃)
     */
    void removeAllTokens(UUID memberId);

    /**
     * 특정 Access Token만 삭제
     */
    void removeAccessToken(UUID memberId, String accessToken);

    /**
     * Refresh Token으로 새로운 Access Token 발급
     */
    String refreshAccessToken(UUID memberId, String refreshToken);
}