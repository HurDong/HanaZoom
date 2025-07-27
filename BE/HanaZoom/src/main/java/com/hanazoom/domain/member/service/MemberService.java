package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;

import java.util.UUID;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(TokenRefreshRequest request);

    void logout(UUID memberId);
}