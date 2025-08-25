package com.hanazoom.domain.member.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class LoginResponse {
    private final UUID id;
    private final String email;
    private final String name;
    private final String address;
    private final Double latitude;
    private final Double longitude;
    private final String accessToken;
    private final String refreshToken;

    public LoginResponse(UUID id, String email, String name, String address, Double latitude, Double longitude,
            String accessToken, String refreshToken) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}