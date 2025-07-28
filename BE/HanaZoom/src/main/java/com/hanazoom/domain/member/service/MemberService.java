package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(TokenRefreshRequest request);

    // 사용자의 지역 ID를 조회하는 메서드 추가
    Long getUserRegionId(String userEmail);
}