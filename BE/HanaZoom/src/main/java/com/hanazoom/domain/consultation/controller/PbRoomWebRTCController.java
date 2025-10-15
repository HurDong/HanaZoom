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

    @PostMapping("/start")
    public ResponseEntity<?> startVideoConsultation() {
        try {
            UUID pbId = getCurrentUserIdFromSecurityContext();
            log.info("PB {} 화상상담 시작 요청", pbId);


            PbRoom existingRoom = pbRoomService.findActiveRoomByPbId(pbId);

            if (existingRoom != null) {
                log.info("기존 방 사용: {}", existingRoom.getId());
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "roomId", existingRoom.getId(),
                        "inviteUrl", generateInviteUrl(existingRoom.getId()),
                        "message", "기존 방을 사용합니다"));
            }


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

    @PostMapping("/{roomId}/join")
    public ResponseEntity<?> joinRoom(@PathVariable UUID roomId, @RequestBody(required = false) Map<String, Object> requestBody) {
        try {
            log.info("=== 고객 입장 API 호출 시작 ===");
            log.info("roomId: {}", roomId);
            log.info("requestBody: {}", requestBody);

            UUID customerId;

            try {

                customerId = getCurrentUserIdFromSecurityContext();
                log.info("로그인된 고객 {} 방 {} 참여 요청", customerId, roomId);
            } catch (Exception e) {

                log.warn("비로그인 사용자 입장 시도 - 거부됨");
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "error", "로그인이 필요합니다"));
            }

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


            log.info("참여자 추가 시작: customerId={}, roomId={}", customerId, roomId);
            Member customer = memberRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalStateException("고객 정보를 찾을 수 없습니다"));

            PbRoomParticipant participant = pbRoomService.addParticipant(room, customer, ParticipantRole.GUEST);
            log.info("참여자 추가 성공: participantId={}", participant.getId());
            room.addParticipant();

            log.info("고객 {} 방 {} 참여 성공 - participantId: {}", customerId, roomId, participant.getId());

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


            if (!room.getPb().getId().equals(pbId)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "방의 주인이 아닙니다"));
            }


            try {
                pbRoomService.removeParticipant(roomId, memberId);
            } catch (Exception e) {
                log.error("참여자 강제 퇴장 실패", e);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "참여자를 찾을 수 없습니다"));
            }


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

    @MessageMapping("/webrtc/{roomId}/offer")
    public void handleOffer(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> offerData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            log.info("방 {}에서 사용자 {}가 Offer 전송", roomId, fromUserId);


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

    @MessageMapping("/webrtc/{roomId}/answer")
    public void handleAnswer(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> answerData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            log.info("방 {}에서 사용자 {}가 Answer 전송", roomId, fromUserId);


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

    @MessageMapping("/webrtc/{roomId}/ice-candidate")
    public void handleIceCandidate(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> candidateData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            log.info("방 {}에서 사용자 {}가 ICE Candidate 전송", roomId, fromUserId);


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

    @MessageMapping("/webrtc/{roomId}/user-joined")
    public void handleUserJoined(
            @DestinationVariable UUID roomId,
            @Payload Map<String, Object> userData,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            UUID fromUserId = getCurrentUserId(headerAccessor);
            String userType = (String) userData.get("userType");
            log.info("방 {}에서 사용자 {} ({}) 입장 알림", roomId, fromUserId, userType);


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

    @MessageMapping("/chat/{roomId}/send")
    public void handleChatMessage(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> messageData,
            SimpMessageHeaderAccessor headerAccessor) {

        log.info("🎯 === 채팅 메시지 수신 시작 ===");
        log.info("🎯 roomId: {}", roomId);
        log.info("🎯 messageData: {}", messageData);
        log.info("🎯 headerAccessor: {}", headerAccessor);

        try {

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            log.info("SecurityContext Authentication: {}", authentication);

            UUID fromUserId = getCurrentUserId(headerAccessor);
            String message = (String) messageData.get("message");
            String senderName = (String) messageData.get("senderName");
            String userType = (String) messageData.get("userType");

            log.info("방 {}에서 사용자 {} ({})가 채팅 메시지 전송: {}", roomId, fromUserId, senderName, message);


            messagingTemplate.convertAndSend(
                    "/topic/pb-room/" + roomId + "/chat",
                    Map.of(
                            "type", "chat-message",
                            "messageId", UUID.randomUUID().toString(),
                            "message", message,
                            "senderId", fromUserId,
                            "senderName", senderName,
                            "userType", userType,
                            "timestamp", System.currentTimeMillis()));

        } catch (Exception e) {
            log.error("채팅 메시지 전송 실패", e);
        }
    }


    @MessageMapping("/test")
    public void handleTest(@Payload Map<String, Object> data) {
        log.info("🧪 테스트 메시지 수신: {}", data);
    }

    private UUID getCurrentUserId(SimpMessageHeaderAccessor headerAccessor) {
        log.info("=== getCurrentUserId 호출 ===");


        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("SecurityContext Authentication: {}", authentication);

        if (authentication != null && authentication.getPrincipal() instanceof Member) {
            Member member = (Member) authentication.getPrincipal();
            log.info("SecurityContext에서 사용자 정보 발견: {}", member.getId());
            return member.getId();
        }


        if (headerAccessor != null) {
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            log.info("WebSocket 세션 속성: {}", sessionAttributes);

            if (sessionAttributes != null) {
                String userId = (String) sessionAttributes.get("USER_ID");
                log.info("세션에서 USER_ID: {}", userId);

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
