package com.hanazoom.domain.chat.controller;

import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.domain.member.service.MemberService;
import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final MemberService memberService;
    private final JwtUtil jwtUtil;

    @GetMapping("/region-info")
    public ResponseEntity<ApiResponse<RegionChatInfo>> getRegionChatInfo(
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("지역 정보 조회 요청 - Authorization: {}",
                    authHeader.substring(0, Math.min(20, authHeader.length())) + "...");

            // Bearer 토큰에서 JWT 추출
            String token = authHeader.replace("Bearer ", "");
            log.info("토큰 추출 완료");

            // JWT에서 이메일 추출
            String email = jwtUtil.getEmailFromToken(token);
            log.info("이메일 추출 완료: {}", email);

            // 사용자 지역 조회
            Long regionId = memberService.getUserRegionId(email);
            log.info("사용자 {}의 지역 ID: {}", email, regionId);

            if (regionId == null) {
                log.warn("사용자 {}의 지역 정보를 찾을 수 없음", email);
                return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 찾을 수 없습니다."));
            }

            RegionChatInfo info = new RegionChatInfo(regionId, "지역 " + regionId + "번 채팅방");
            log.info("지역 정보 반환: regionId={}, roomName={}", regionId, info.roomName);

            return ResponseEntity.ok(ApiResponse.success(info));
        } catch (Exception e) {
            log.error("지역 정보 조회 중 오류 발생", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 가져올 수 없습니다: " + e.getMessage()));
        }
    }

    public static class RegionChatInfo {
        public Long regionId;
        public String roomName;

        public RegionChatInfo(Long regionId, String roomName) {
            this.regionId = regionId;
            this.roomName = roomName;
        }
    }
}
