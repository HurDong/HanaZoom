package com.hanazoom.domain.member.controller;

import com.hanazoom.domain.member.dto.*;
import com.hanazoom.domain.member.service.MemberService;
import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.global.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        memberService.signup(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입이 완료되었습니다."));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = memberService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = memberService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/region")
    public ResponseEntity<ApiResponse<Long>> getUserRegion(@RequestHeader("Authorization") String authHeader) {
        try {

            String token = authHeader.replace("Bearer ", "");


            String email = jwtUtil.getEmailFromToken(token);


            Long regionId = memberService.getUserRegionId(email);

            return ResponseEntity.ok(ApiResponse.success(regionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 가져올 수 없습니다: " + e.getMessage()));
        }
    }


    @PostMapping("/forgot-password/send-code")
    public ResponseEntity<ApiResponse<Void>> sendPasswordResetCode(
            @RequestBody SendPasswordResetCodeRequest request) {

        memberService.sendPasswordResetCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("비밀번호 재설정 인증 코드가 이메일로 발송되었습니다."));
    }


    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        memberService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 재설정되었습니다."));
    }


    @PostMapping("/kakao-login")
    public ResponseEntity<ApiResponse<LoginResponse>> kakaoLogin(@RequestBody KakaoLoginRequest request) {
        try {
            LoginResponse response = memberService.kakaoLogin(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("카카오 로그인에 실패했습니다: " + e.getMessage()));
        }
    }


    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MemberInfoResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String email = jwtUtil.getEmailFromToken(token);

            MemberInfoResponse userInfo = memberService.getCurrentUserInfo(email);
            return ResponseEntity.ok(ApiResponse.success(userInfo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("사용자 정보를 가져올 수 없습니다: " + e.getMessage()));
        }
    }


    @PutMapping("/location")
    public ResponseEntity<ApiResponse<Void>> updateLocation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LocationUpdateRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String email = jwtUtil.getEmailFromToken(token);

            memberService.updateLocation(email, request);
            return ResponseEntity.ok(ApiResponse.success("위치 정보가 업데이트되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("위치 정보 업데이트에 실패했습니다: " + e.getMessage()));
        }
    }
}