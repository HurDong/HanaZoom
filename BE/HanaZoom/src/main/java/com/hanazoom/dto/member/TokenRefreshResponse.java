package com.hanazoom.dto.member;

import lombok.Getter;

@Getter
public class TokenRefreshResponse {
    private final String accessToken;
    private final String refreshToken;

    public TokenRefreshResponse(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}