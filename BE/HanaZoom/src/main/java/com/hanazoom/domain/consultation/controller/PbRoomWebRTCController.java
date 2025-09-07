package com.hanazoom.domain.consultation.controller;

import com.hanazoom.domain.consultation.entity.PbRoom;
import com.hanazoom.domain.consultation.entity.PbRoomParticipant;
import com.hanazoom.domain.consultation.entity.ParticipantRole;
import com.hanazoom.domain.consultation.service.PbRoomWebRTCService;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pb-rooms")
@RequiredArgsConstructor
@Slf4j
public class PbRoomWebRTCController {

    private final PbRoomWebRTCService pbRoomService;
    private final MemberRepository memberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * PB가 화상상담 시작 버튼을 눌렀을 때
     * 1. 기존 활성 방 확인
     * 2. 없으면 새 방 생성
     * 3. 초대 링크 반환
     */
    @PostMapping("/start")
    public ResponseEntity<?> startVideoConsultation() {
        try {
            UUID pbId = getCurrentUserIdFromSecurityContext();
            log.info("PB {} 화상상담 시작 요청", pbId);

            // 기존 활성 방 확인
            PbRoom existingRoom = pbRoomService.findActiveRoomByPbId(pbId);

            if (existingRoom != null) {
                log.info("기존 방 사용: {}", existingRoom.getId());
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "roomId", existingRoom.getId(),
                        "inviteUrl", generateInviteUrl(existingRoom.getId()),
                        "message", "기존 방을 사용합니다"));
            }

            // 새 방 생성
            Member pb = memberRepository.findById(pbId)
                    .orElseThrow(() -> new IllegalStateException("PB 정보를 찾을 수 없습니다"));

            PbRoom newRoom = pbRoomService.createRoom(pb, pb.getName() + "의 화상상담방");
            log.info("새 방 생성: {}", newRoom.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "roomId", newRoom.getId(),
                    "inviteUrl", generateInviteUrl(newRoom.getId()),
                    "message", "새 방이 생성되었습니다"));

        } catch (Exception e) {
            log.error("화상상담 시작 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * 고객이 초대 링크로 방에 참여
     */
    @PostMapping("/{roomId}/join")
    public ResponseEntity<?> joinRoom(@PathVariable UUID roomId) {
        try {
            UUID customerId = getCurrentUserIdFromSecurityContext();
            log.info("고객 {} 방 {} 참여 요청", customerId, roomId);

            PbRoom room = pbRoomService.findById(roomId);
            if (room == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "존재하지 않는 방입니다"));
            }

            if (!room.canJoin()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "방이 가득 찼습니다"));
            }

            // 참여자 추가
            Member customer = memberRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalStateException("고객 정보를 찾을 수 없습니다"));

            PbRoomParticipant participant = pbRoomService.addParticipant(room, customer, ParticipantRole.GUEST);
            room.addParticipant();

            log.info("고객 {} 방 {} 참여 성공", customerId, roomId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "roomId", roomId,
                    "participantId", participant.getId(),
                    "message", "방 참여 성공"));

        } catch (Exception e) {
            log.error("방 참여 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * 사용자 강제 퇴장 (PB만 가능) - memberId로 퇴장
     */
    @PostMapping("/{roomId}/kick/{memberId}")
    public ResponseEntity<?> kickParticipant(
            @PathVariable UUID roomId,
            @PathVariable UUID memberId) {
        try {
            log.info("=== 강제 퇴장 API 호출 시작 ===");
            log.info("roomId: {}", roomId);
            log.info("memberId: {}", memberId);

            UUID pbId = getCurrentUserIdFromSecurityContext();
            log.info("PB {}가 방 {}에서 참여자 {} 강제 퇴장 요청", pbId, roomId, memberId);

            PbRoom room = pbRoomService.findById(roomId);
            if (room == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "존재하지 않는 방입니다"));
            }

            // PB가 방의 주인인지 확인
            if (!room.getPb().getId().equals(pbId)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "방의 주인이 아닙니다"));
            }

            // 참여자 강제 퇴장
            try {
                pbRoomService.removeParticipant(roomId, memberId);
            } catch (Exception e) {
                log.error("참여자 강제 퇴장 실패", e);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "참여자를 찾을 수 없습니다"));
            }

            // WebSocket으로 강제 퇴장 알림 전송
            messagingTemplate.convertAndSend(
                    "/topic/pb-room/" + roomId + "/webrtc",
                    Map.of(
                            "type", "user-kicked",
                            "participantId", memberId,
                            "kickedBy", pbId));

            log.info("참여자 {} 강제 퇴장 성공", memberId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "참여자가 강제 퇴장되었습니다"));

        } catch (Exception e) {
            log.error("참여자 강제 퇴장 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * 방에서 나가기
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable UUID roomId) {
        try {
            UUID userId = getCurrentUserIdFromSecurityContext();
            log.info("사용자 {} 방 {} 나가기 요청", userId, roomId);

            pbRoomService.removeParticipant(roomId, userId);

            log.info("사용자 {} 방 {} 나가기 성공", userId, roomId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "방에서 나갔습니다"));

        } catch (Exception e) {
            log.error("방 나가기 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * WebRTC Offer 전송
     */
    @MessageMapping("/webrtc/{roomId}/offer")
    public void handleOffer(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> offerData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            log.info("방 {}에서 사용자 {}가 Offer 전송", roomId, fromUserId);

            // 다른 참여자들에게 Offer 전달
            messagingTemplate.convertAndSend(
                    "/topic/pb-room/" + roomId + "/webrtc",
                    Map.of(
                            "type", "offer",
                            "fromUserId", fromUserId,
                            "offer", offerData.get("offer")));

        } catch (Exception e) {
            log.error("Offer 전송 실패", e);
        }
    }

    /**
     * WebRTC Answer 전송
     */
    @MessageMapping("/webrtc/{roomId}/answer")
    public void handleAnswer(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> answerData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            log.info("방 {}에서 사용자 {}가 Answer 전송", roomId, fromUserId);

            // 다른 참여자들에게 Answer 전달
            messagingTemplate.convertAndSend(
                    "/topic/pb-room/" + roomId + "/webrtc",
                    Map.of(
                            "type", "answer",
                            "fromUserId", fromUserId,
                            "answer", answerData.get("answer")));

        } catch (Exception e) {
            log.error("Answer 전송 실패", e);
        }
    }

    /**
     * WebRTC ICE Candidate 전송
     */
    @MessageMapping("/webrtc/{roomId}/ice-candidate")
    public void handleIceCandidate(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> candidateData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            log.info("방 {}에서 사용자 {}가 ICE Candidate 전송", roomId, fromUserId);

            // 다른 참여자들에게 ICE Candidate 전달
            messagingTemplate.convertAndSend(
                    "/topic/pb-room/" + roomId + "/webrtc",
                    Map.of(
                            "type", "ice-candidate",
                            "fromUserId", fromUserId,
                            "candidate", candidateData.get("candidate")));

        } catch (Exception e) {
            log.error("ICE Candidate 전송 실패", e);
        }
    }

    /**
     * 사용자 입장 알림 처리
     */
    @MessageMapping("/webrtc/{roomId}/user-joined")
    public void handleUserJoined(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> userData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            String userType = (String) userData.get("userType");
            log.info("방 {}에서 사용자 {} ({}) 입장 알림", roomId, fromUserId, userType);

            // 다른 참여자들에게 사용자 입장 알림 전달
            messagingTemplate.convertAndSend(
                    "/topic/pb-room/" + roomId + "/webrtc",
                    Map.of(
                            "type", "user-joined",
                            "userType", userType,
                            "userId", fromUserId));

        } catch (Exception e) {
            log.error("사용자 입장 알림 전송 실패", e);
        }
    }

    private UUID getCurrentUserId(SimpMessageHeaderAccessor headerAccessor) {
        // 1. SecurityContext에서 사용자 정보 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Member) {
            Member member = (Member) authentication.getPrincipal();
            return member.getId();
        }

        // 2. WebSocket 세션 속성에서 사용자 정보 확인
        if (headerAccessor != null) {
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String userId = (String) sessionAttributes.get("USER_ID");
                if (userId != null) {
                    try {
                        return UUID.fromString(userId);
                    } catch (IllegalArgumentException e) {
                        log.warn("잘못된 사용자 ID 형식: {}", userId);
                    }
                }
            }
        }

        throw new IllegalStateException("인증된 사용자 정보를 찾을 수 없습니다");
    }

    private UUID getCurrentUserIdFromSecurityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Member) {
            Member member = (Member) authentication.getPrincipal();
            return member.getId();
        }
        throw new IllegalStateException("인증된 사용자 정보를 찾을 수 없습니다");
    }

    private String generateInviteUrl(UUID roomId) {
        return "https://hanazoom.com/join/" + roomId;
    }
}
