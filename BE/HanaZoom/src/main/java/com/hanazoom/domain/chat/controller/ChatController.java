package com.hanazoom.domain.chat.controller;

import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.domain.member.service.MemberService;
import com.hanazoom.domain.region.service.RegionService;
import com.hanazoom.domain.chat.service.RegionChatService;
import com.hanazoom.domain.chat.document.RegionChatMessage;
import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final MemberService memberService;
    private final RegionService regionService;
    private final RegionChatService regionChatService;
    private final JwtUtil jwtUtil;

    @GetMapping("/region-info")
    public ResponseEntity<ApiResponse<RegionChatInfo>> getRegionChatInfo(
            @RequestHeader("Authorization") String authHeader) {
        try {

            String token = authHeader.replace("Bearer ", "");


            String email = jwtUtil.getEmailFromToken(token);


            Long regionId = memberService.getUserRegionId(email);

            if (regionId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 찾을 수 없습니다."));
            }


            String regionName = regionService.getFullRegionName(regionId);
            String roomName = regionName != null ? regionName + " 채팅방" : "지역 " + regionId + "번 채팅방";

            RegionChatInfo info = new RegionChatInfo(regionId, roomName);

            return ResponseEntity.ok(ApiResponse.success(info));
        } catch (Exception e) {
            log.error("지역 정보 조회 중 오류 발생", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("지역 정보를 가져올 수 없습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/region/{regionId}/messages")
    public ResponseEntity<ApiResponse<List<RegionChatMessage>>> getRegionMessages(
            @PathVariable Long regionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            log.info("📥 지역 채팅 메시지 조회 요청: regionId={}, page={}, size={}", regionId, page, size);

            List<RegionChatMessage> messages = regionChatService.getRecentMessages(regionId, page, size);

            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            log.error("❌ 지역 채팅 메시지 조회 중 오류 발생", e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("채팅 메시지를 가져올 수 없습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/region/{regionId}/recent")
    public ResponseEntity<ApiResponse<List<RegionChatMessage>>> getRecentMessages(
            @PathVariable Long regionId,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            log.info("📥 지역 최근 채팅 메시지 조회 요청: regionId={}, limit={}", regionId, limit);

            List<RegionChatMessage> messages = regionChatService.getRecentMessages(regionId, limit);

            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            log.error("❌ 최근 채팅 메시지 조회 중 오류 발생", e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("최근 채팅 메시지를 가져올 수 없습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/region/{regionId}/count")
    public ResponseEntity<ApiResponse<Long>> getMessageCount(@PathVariable Long regionId) {
        try {
            Long count = regionChatService.getMessageCount(regionId);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (Exception e) {
            log.error("❌ 메시지 개수 조회 중 오류 발생", e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("메시지 개수를 가져올 수 없습니다: " + e.getMessage()));
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
