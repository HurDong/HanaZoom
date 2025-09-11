package com.hanazoom.domain.consultation.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class WebRTCDto {

    // 참여 요청
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinRequest {
        private String consultationId;
    }

    // 참여 응답
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinResponse {
        private boolean success;
        private String consultationId;
        private String userId;
        private String userRole;
        private Map<String, Object> participants;
        private String error;
    }

    // Offer 요청
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfferRequest {
        private String toUserId;
        private Object offer; // RTCSessionDescription
    }

    // Answer 요청
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerRequest {
        private String toUserId;
        private Object answer; // RTCSessionDescription
    }

    // ICE Candidate 요청
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IceCandidateRequest {
        private String toUserId;
        private Object candidate; // RTCIceCandidate
    }

    // 이벤트 클래스들
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantJoinedEvent {
        private String consultationId;
        private String userId;
        private String userRole;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantLeftEvent {
        private String consultationId;
        private String userId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfferEvent {
        private String consultationId;
        private String fromUserId;
        private String toUserId;
        private Object offer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerEvent {
        private String consultationId;
        private String fromUserId;
        private String toUserId;
        private Object answer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IceCandidateEvent {
        private String consultationId;
        private String fromUserId;
        private String toUserId;
        private Object candidate;
    }

    // 상담 상태 이벤트
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsultationStatusEvent {
        private String consultationId;
        private String status; // STARTED, ENDED, PAUSED
        private String message;
    }

    // 채팅 메시지 요청
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageRequest {
        private String userName;
        private String message;
    }

    // 채팅 메시지 이벤트
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageEvent {
        private String consultationId;
        private String userId;
        private String userName;
        private String message;
        private long timestamp;
    }
}
