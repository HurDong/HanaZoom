package com.hanazoom.domain.consultation.websocket;

import com.hanazoom.domain.consultation.service.ConsultationService;
import com.hanazoom.domain.consultation.websocket.dto.WebRTCDto;
import com.hanazoom.domain.consultation.websocket.dto.WebRTCDto.*;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebRTCSignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConsultationService consultationService;
    private final JwtUtil jwtUtil;

    // 활성 상담 세션 관리 - 클라이언트별로 격리
    // Key: "clientId:consultationId", Value: ConsultationSession
    private final Map<String, ConsultationSession> activeSessions = new ConcurrentHashMap<>();

    @MessageMapping("/consultation/{consultationId}/join")
    public void joinConsultation(
            @DestinationVariable String consultationId,
            @Payload JoinRequest joinRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            // 클라이언트 ID 추출
            String clientId = getClientId(headerAccessor);
            
            // 인증된 사용자 정보 가져오기
            UUID userId = getCurrentUserId(headerAccessor);
            String userRole = getUserRole(consultationId, userId);
            
            log.info("클라이언트 {}에서 사용자 {}가 상담 {}에 참여 시도 (역할: {})", clientId, userId, consultationId, userRole);
            
            // 클라이언트별 상담 세션 생성 또는 참여
            String sessionKey = clientId + ":" + consultationId;
            ConsultationSession session = activeSessions.computeIfAbsent(sessionKey, 
                key -> new ConsultationSession(consultationId, clientId));
            
            boolean isFirstParticipant = session.getParticipants().isEmpty();
            session.addParticipant(userId.toString(), userRole, headerAccessor.getSessionId());
            
            // 첫 번째 참여자(PB)가 참여하면 상담 상태를 IN_PROGRESS로 변경 (가능한 상태일 때만)
            if (isFirstParticipant && "PB".equals(userRole)) {
                try {
                    UUID cId = UUID.fromString(consultationId);
                    var consultation = consultationService.getConsultationById(cId, userId);
                    if (consultation.isCanBeStarted()) {
                        consultationService.startConsultation(cId, userId);
                        log.info("상담 {} 상태를 IN_PROGRESS로 변경", consultationId);
                    } else {
                        log.warn("상담 {}은 시작 불가 상태({})로 start 호출 생략", consultationId, consultation.getStatus());
                    }
                } catch (Exception e) {
                    log.error("상담 상태 변경 실패: {}", e.getMessage(), e);
                }
            }
            
            // 참여자에게 성공 응답
            Map<String, Object> participantsMap = new java.util.HashMap<>();
            session.getParticipants().forEach((id, participant) -> {
                participantsMap.put(id, Map.of(
                    "userId", participant.getUserId(),
                    "role", participant.getRole(),
                    "sessionId", participant.getSessionId()
                ));
            });
            
            JoinResponse response = JoinResponse.builder()
                .success(true)
                .consultationId(consultationId)
                .userId(userId.toString())
                .userRole(userRole)
                .participants(participantsMap)
                .build();
            
            messagingTemplate.convertAndSendToUser(
                headerAccessor.getSessionId(), 
                "/queue/consultation/joined", 
                response
            );
            
            // 다른 참여자들에게 새 참여자 알림
            ParticipantJoinedEvent event = ParticipantJoinedEvent.builder()
                .consultationId(consultationId)
                .userId(userId.toString())
                .userRole(userRole)
                .build();
            
            messagingTemplate.convertAndSend(
                "/topic/consultation/" + consultationId + "/participant-joined", 
                event
            );
            
        } catch (Exception e) {
            log.error("상담 참여 실패: {}", e.getMessage(), e);
            
            JoinResponse errorResponse = JoinResponse.builder()
                .success(false)
                .error("상담 참여에 실패했습니다: " + e.getMessage())
                .build();
            
            messagingTemplate.convertAndSendToUser(
                headerAccessor.getSessionId(), 
                "/queue/consultation/joined", 
                errorResponse
            );
        }
    }

    @MessageMapping("/consultation/{consultationId}/offer")
    public void handleOffer(
            @DestinationVariable String consultationId,
            @Payload OfferRequest offerRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String clientId = getClientId(headerAccessor);
            UUID userId = getCurrentUserId(headerAccessor);
            log.info("클라이언트 {}에서 상담 {}의 사용자 {}가 offer 전송", clientId, consultationId, userId);
            
            // 다른 참여자들에게 offer 전달
            OfferEvent event = OfferEvent.builder()
                .consultationId(consultationId)
                .fromUserId(userId.toString())
                .toUserId(offerRequest.getToUserId())
                .offer(offerRequest.getOffer())
                .build();
            
            messagingTemplate.convertAndSend(
                "/topic/consultation/" + consultationId + "/offer", 
                event
            );
            
        } catch (Exception e) {
            log.error("Offer 전송 실패: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/consultation/{consultationId}/answer")
    public void handleAnswer(
            @DestinationVariable String consultationId,
            @Payload AnswerRequest answerRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String clientId = getClientId(headerAccessor);
            UUID userId = getCurrentUserId(headerAccessor);
            log.info("클라이언트 {}에서 상담 {}의 사용자 {}가 answer 전송", clientId, consultationId, userId);
            
            // 다른 참여자들에게 answer 전달
            AnswerEvent event = AnswerEvent.builder()
                .consultationId(consultationId)
                .fromUserId(userId.toString())
                .toUserId(answerRequest.getToUserId())
                .answer(answerRequest.getAnswer())
                .build();
            
            messagingTemplate.convertAndSend(
                "/topic/consultation/" + consultationId + "/answer", 
                event
            );
            
        } catch (Exception e) {
            log.error("Answer 전송 실패: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/consultation/{consultationId}/ice-candidate")
    public void handleIceCandidate(
            @DestinationVariable String consultationId,
            @Payload IceCandidateRequest iceRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String clientId = getClientId(headerAccessor);
            UUID userId = getCurrentUserId(headerAccessor);
            log.info("클라이언트 {}에서 상담 {}의 사용자 {}가 ICE candidate 전송", clientId, consultationId, userId);
            
            // 다른 참여자들에게 ICE candidate 전달
            IceCandidateEvent event = IceCandidateEvent.builder()
                .consultationId(consultationId)
                .fromUserId(userId.toString())
                .toUserId(iceRequest.getToUserId())
                .candidate(iceRequest.getCandidate())
                .build();
            
            messagingTemplate.convertAndSend(
                "/topic/consultation/" + consultationId + "/ice-candidate", 
                event
            );
            
        } catch (Exception e) {
            log.error("ICE candidate 전송 실패: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/consultation/{consultationId}/leave")
    public void leaveConsultation(
            @DestinationVariable String consultationId,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String clientId = getClientId(headerAccessor);
            UUID userId = getCurrentUserId(headerAccessor);
            log.info("클라이언트 {}에서 사용자 {}가 상담 {}에서 나감", clientId, userId, consultationId);
            
            // 클라이언트별 세션에서 참여자 제거
            String sessionKey = clientId + ":" + consultationId;
            ConsultationSession session = activeSessions.get(sessionKey);
            if (session != null) {
                Participant participant = session.getParticipants().get(userId.toString());
                String userRole = participant != null ? participant.getRole() : null;
                session.removeParticipant(userId.toString());
                
                // 다른 참여자들에게 나감 알림
                ParticipantLeftEvent event = ParticipantLeftEvent.builder()
                    .consultationId(consultationId)
                    .userId(userId.toString())
                    .build();
                
                messagingTemplate.convertAndSend(
                    "/topic/consultation/" + consultationId + "/participant-left", 
                    event
                );
                
                // PB가 나가거나 세션이 비어있으면 상담 종료
                if ("PB".equals(userRole) || session.getParticipants().isEmpty()) {
                    try {
                        consultationService.endConsultation(UUID.fromString(consultationId), userId, "화상 상담 종료");
                        log.info("상담 {} 상태를 COMPLETED로 변경", consultationId);
                    } catch (Exception e) {
                        log.error("상담 종료 상태 변경 실패: {}", e.getMessage(), e);
                    }
                }
                
                // 세션이 비어있으면 제거
                if (session.getParticipants().isEmpty()) {
                    activeSessions.remove(sessionKey);
                }
            }
            
        } catch (Exception e) {
            log.error("상담 나가기 실패: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/consultation/{consultationId}/chat")
    public void handleChatMessage(
            @DestinationVariable String consultationId,
            @Payload ChatMessageRequest chatRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        try {
            String clientId = getClientId(headerAccessor);
            UUID userId = getCurrentUserId(headerAccessor);
            log.info("클라이언트 {}에서 상담 {}의 사용자 {}가 채팅 메시지 전송", clientId, consultationId, userId);
            
            // 채팅 메시지 이벤트 생성
            ChatMessageEvent event = ChatMessageEvent.builder()
                .consultationId(consultationId)
                .userId(userId.toString())
                .userName(chatRequest.getUserName())
                .message(chatRequest.getMessage())
                .timestamp(System.currentTimeMillis())
                .build();
            
            // 모든 참여자에게 채팅 메시지 전달
            messagingTemplate.convertAndSend(
                "/topic/consultation/" + consultationId + "/chat", 
                event
            );
            
        } catch (Exception e) {
            log.error("채팅 메시지 전송 실패: {}", e.getMessage(), e);
        }
    }

    private String getClientId(SimpMessageHeaderAccessor headerAccessor) {
        // WebSocket 세션 속성에서 클라이언트 ID 확인
        if (headerAccessor != null) {
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String clientId = (String) sessionAttributes.get("CLIENT_ID");
                if (clientId != null) {
                    return clientId;
                }
            }
        }
        
        // 클라이언트 ID가 없으면 기본값 반환 (기존 호환성)
        return "default";
    }

    private UUID getCurrentUserId(SimpMessageHeaderAccessor headerAccessor) {
        // 1. SecurityContext에서 사용자 정보 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Member) {
            Member member = (Member) authentication.getPrincipal();
            log.info("SecurityContext에서 사용자 정보 조회 성공: {} (ID: {})", member.getEmail(), member.getId());
            return member.getId();
        }
        
        // 2. WebSocket 세션 속성에서 사용자 정보 확인
        if (headerAccessor != null) {
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String userIdStr = (String) sessionAttributes.get("USER_ID");
                if (userIdStr != null) {
                    try {
                        UUID userId = UUID.fromString(userIdStr);
                        String userEmail = (String) sessionAttributes.get("USER_EMAIL");
                        log.info("WebSocket 세션에서 사용자 정보 조회 성공: {} (ID: {})", userEmail, userId);
                        return userId;
                    } catch (IllegalArgumentException e) {
                        log.error("잘못된 사용자 ID 형식: {}", userIdStr);
                    }
                }
            }
        }
        
        log.warn("SecurityContext와 WebSocket 세션 모두에서 사용자 정보를 찾을 수 없음");
        throw new IllegalStateException("인증된 사용자 정보를 찾을 수 없습니다");
    }

    private String getUserRole(String consultationId, UUID userId) {
        try {
            // UUID 형식 검증
            UUID consultationUuid;
            try {
                consultationUuid = UUID.fromString(consultationId);
            } catch (IllegalArgumentException e) {
                log.warn("잘못된 상담 ID 형식: {}", consultationId);
                // 테스트용 상담 ID인 경우 기본적으로 PB 권한 부여
                return "PB";
            }
            
            // 상담 정보를 조회하여 사용자가 PB인지 고객인지 확인
            var consultation = consultationService.getConsultationById(consultationUuid, userId);
            
            if (consultation.getPbId().equals(userId)) {
                return "PB";
            } else if (consultation.getClientId().equals(userId)) {
                return "CLIENT";
            } else {
                throw new IllegalStateException("상담 참여 권한이 없습니다");
            }
        } catch (Exception e) {
            log.error("사용자 역할 확인 실패: {}", e.getMessage(), e);
            // 오류 발생 시 기본적으로 PB 권한 부여 (테스트용)
            log.warn("기본 PB 권한으로 설정: {}", userId);
            return "PB";
        }
    }

    // 내부 클래스들
    public static class ConsultationSession {
        private final String consultationId;
        private final String clientId;
        private final Map<String, Participant> participants = new ConcurrentHashMap<>();

        public ConsultationSession(String consultationId, String clientId) {
            this.consultationId = consultationId;
            this.clientId = clientId;
        }

        public void addParticipant(String userId, String role, String sessionId) {
            participants.put(userId, new Participant(userId, role, sessionId));
        }

        public void removeParticipant(String userId) {
            participants.remove(userId);
        }

        public Map<String, Participant> getParticipants() {
            return new ConcurrentHashMap<>(participants);
        }
    }

    public static class Participant {
        private final String userId;
        private final String role;
        private final String sessionId;

        public Participant(String userId, String role, String sessionId) {
            this.userId = userId;
            this.role = role;
            this.sessionId = sessionId;
        }

        // Getters
        public String getUserId() { return userId; }
        public String getRole() { return role; }
        public String getSessionId() { return sessionId; }
    }
}
