package com.hanazoom.service;

import com.hanazoom.dto.member.LoginRequest;
import com.hanazoom.dto.member.LoginResponse;
import com.hanazoom.dto.member.SignupRequest;
import com.hanazoom.dto.member.TokenRefreshRequest;
import com.hanazoom.dto.member.TokenRefreshResponse;

import java.util.UUID;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(TokenRefreshRequest request);

    void logout(UUID memberId);
}