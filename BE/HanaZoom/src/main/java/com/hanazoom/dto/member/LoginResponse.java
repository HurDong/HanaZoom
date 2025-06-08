package com.hanazoom.dto.member;

import lombok.Getter;

import java.util.UUID;

@Getter
public class LoginResponse {
    private final UUID id;
    private final String email;
    private final String name;
    private final String token;

    public LoginResponse(UUID id, String email, String name, String token) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.token = token;
    }
}