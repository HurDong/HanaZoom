package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.LoginRequest;
import com.hanazoom.domain.member.dto.LoginResponse;
import com.hanazoom.domain.member.dto.SignupRequest;
import com.hanazoom.domain.member.dto.TokenRefreshRequest;
import com.hanazoom.domain.member.dto.TokenRefreshResponse;

import java.util.UUID;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(TokenRefreshRequest request);

    void logout(UUID memberId);
}