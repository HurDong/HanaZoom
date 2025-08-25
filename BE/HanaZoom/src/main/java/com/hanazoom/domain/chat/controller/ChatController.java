package com.hanazoom.domain.chat.controller;

import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.domain.member.service.MemberService;
import com.hanazoom.domain.region.service.RegionService;
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
    private final RegionService regionService;
    private final JwtUtil jwtUtil;

    @GetMapping("/region-info")
    public ResponseEntity<ApiResponse<RegionChatInfo>> getRegionChatInfo(
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Bearer 토큰에서 JWT 추출
            String token = authHeader.replace("Bearer ", "");

            // JWT에서 이메일 추출
            String email = jwtUtil.getEmailFromToken(token);

            // 사용자 지역 조회
            Long regionId = memberService.getUserRegionId(email);

            if (regionId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 찾을 수 없습니다."));
            }

            // 지역 이름 가져오기
            String regionName = regionService.getFullRegionName(regionId);
            String roomName = regionName != null ? regionName + " 채팅방" : "지역 " + regionId + "번 채팅방";

            RegionChatInfo info = new RegionChatInfo(regionId, roomName);

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
