package com.hanazoom.domain.member.dto;

import lombok.Getter;

import java.util.UUID;

@Getter
public class LoginResponse {
    private final UUID id;
    private final String email;
    private final String name;
    private final String address;
    private final String accessToken;
    private final String refreshToken;

    public LoginResponse(UUID id, String email, String name, String address, String accessToken, String refreshToken) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.address = address;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}