package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(TokenRefreshRequest request);

    // 사용자의 지역 ID를 조회하는 메서드 추가
    Long getUserRegionId(String userEmail);

    // 비밀번호 찾기 관련 메서드 추가
    void sendPasswordResetCode(String email);

    void resetPassword(String email, String code, String newPassword);

    // 소셜 로그인 관련 메서드
    LoginResponse kakaoLogin(KakaoLoginRequest request);

    // 위치 정보 업데이트
    void updateLocation(String email, LocationUpdateRequest request);

    // 현재 사용자 정보 조회
    MemberInfoResponse getCurrentUserInfo(String email);
}