package com.hanazoom.domain.member.controller;

import com.hanazoom.domain.member.dto.LoginRequest;
import com.hanazoom.domain.member.dto.LoginResponse;
import com.hanazoom.domain.member.dto.SignupRequest;
import com.hanazoom.domain.member.dto.TokenRefreshRequest;
import com.hanazoom.domain.member.dto.TokenRefreshResponse;
import com.hanazoom.domain.member.service.MemberService;
import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<String>> signup(@Valid @RequestBody SignupRequest request) {
        try {
            memberService.signup(request);
            return ResponseEntity.ok(new ApiResponse<>("회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("회원가입 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("회원가입 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = memberService.login(request);
            return ResponseEntity.ok(new ApiResponse<>(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("로그인 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("로그인 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request) {
        try {
            TokenRefreshResponse response = memberService.refreshToken(request);
            return ResponseEntity.ok(new ApiResponse<>(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("토큰 갱신 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("토큰 갱신 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader("Authorization") String authorization) {
        try {
            String token = authorization.replace("Bearer ", "");
            UUID memberId = jwtUtil.getMemberIdFromToken(token);
            memberService.logout(memberId);
            return ResponseEntity.ok(new ApiResponse<>("로그아웃이 완료되었습니다."));
        } catch (Exception e) {
            log.error("로그아웃 중 오류 발생", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("로그아웃 중 오류가 발생했습니다."));
        }
    }
}