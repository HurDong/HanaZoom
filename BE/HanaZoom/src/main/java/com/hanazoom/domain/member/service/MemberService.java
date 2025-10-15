package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);

    TokenRefreshResponse refreshToken(TokenRefreshRequest request);


    Long getUserRegionId(String userEmail);


    void sendPasswordResetCode(String email);

    void resetPassword(String email, String code, String newPassword);


    LoginResponse kakaoLogin(KakaoLoginRequest request);


    void updateLocation(String email, LocationUpdateRequest request);


    MemberInfoResponse getCurrentUserInfo(String email);
}