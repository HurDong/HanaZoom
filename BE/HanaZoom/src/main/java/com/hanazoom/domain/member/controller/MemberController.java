package com.hanazoom.domain.member.controller;

import com.hanazoom.domain.member.dto.*;
import com.hanazoom.domain.member.service.MemberService;
import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.global.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        try {
            memberService.signup(request);
            return ResponseEntity.ok(ApiResponse.success("회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = memberService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request) {
        try {
            TokenRefreshResponse response = memberService.refreshToken(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/region")
    public ResponseEntity<ApiResponse<Long>> getUserRegion(@RequestHeader("Authorization") String authHeader) {
        try {
            // Bearer 토큰에서 JWT 추출
            String token = authHeader.replace("Bearer ", "");

            // JWT에서 이메일 추출
            String email = jwtUtil.getEmailFromToken(token);

            // 사용자 지역 조회
            Long regionId = memberService.getUserRegionId(email);

            return ResponseEntity.ok(ApiResponse.success(regionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 가져올 수 없습니다: " + e.getMessage()));
        }
    }
}