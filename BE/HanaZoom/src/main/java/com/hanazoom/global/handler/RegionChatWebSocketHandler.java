package com.hanazoom.global.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegionChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    private void sendMessageSafely(WebSocketSession session, String message) {
        if (session != null && session.isOpen()) {
            try {
                synchronized (session) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                log.error("메시지 전송 실패 - 세션: {}", session.getId(), e);
                closeSessionSafely(session);
            }
        }
    }

    private void closeSessionSafely(WebSocketSession session) {
        if (session != null) {
            try {
                session.close();
            } catch (IOException e) {
                log.error("세션 종료 실패: {}", session.getId(), e);
            } finally {
                sessions.remove(session.getId());
            }
        }
    }

    private void broadcastMessage(String message, String excludeSessionId) {
        sessions.forEach((id, session) -> {
            if (!id.equals(excludeSessionId)) {
                sendMessageSafely(session, message);
            }
        });
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        log.info("지역 채팅 WebSocket 연결 생성: {}", sessionId);

        try {
            // 시스템 메시지를 JSON 형식으로 전송
            Map<String, Object> message = new HashMap<>();
            message.put("type", "system");
            message.put("messageType", "ENTER");
            message.put("memberName", "System");
            message.put("content", "지역 채팅방에 연결되었습니다.");
            message.put("createdAt", java.time.LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(message);
            sendMessageSafely(session, jsonMessage);

            // 다른 사용자들에게 입장 알림
            message.put("content", "새로운 사용자가 입장했습니다.");
            broadcastMessage(objectMapper.writeValueAsString(message), sessionId);
        } catch (Exception e) {
            log.error("입장 메시지 전송 실패: {}", sessionId, e);
            closeSessionSafely(session);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String sessionId = session.getId();
        log.debug("메시지 수신 - 세션: {}, 내용: {}", sessionId, message.getPayload());

        try {
            // 수신된 메시지를 JSON 형식으로 변환
            Map<String, String> receivedMsg = objectMapper.readValue(message.getPayload(), Map.class);
            String content = receivedMsg.get("content");
            if (content == null || content.trim().isEmpty()) {
                log.warn("Empty message from session {} ignored.", sessionId);
                return;
            }

            Map<String, Object> chatMessage = new HashMap<>();
            chatMessage.put("id", java.util.UUID.randomUUID().toString());
            chatMessage.put("type", "message");
            chatMessage.put("messageType", "CHAT");
            chatMessage.put("memberName", sessionId);
            chatMessage.put("content", content);
            chatMessage.put("createdAt", java.time.LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(chatMessage);

            // 모든 사용자에게 브로드캐스트 (발신자 포함)
            sessions.forEach((id, s) -> sendMessageSafely(s, jsonMessage));
        } catch (Exception e) {
            log.error("메시지 처리 실패 - 세션: {}", sessionId, e);
            closeSessionSafely(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sessionId = session.getId();
        sessions.remove(sessionId);
        log.info("지역 채팅 WebSocket 연결 종료: {}", sessionId);

        try {
            // 퇴장 메시지를 JSON 형식으로 전송
            Map<String, Object> message = new HashMap<>();
            message.put("type", "system");
            message.put("messageType", "LEAVE");
            message.put("memberName", "System");
            message.put("content", "사용자가 채팅방을 나갔습니다.");
            message.put("createdAt", java.time.LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(message);

            // 남은 세션들에게 퇴장 메시지 전송
            broadcastMessage(jsonMessage, sessionId);
        } catch (Exception e) {
            log.error("퇴장 메시지 전송 실패: {}", sessionId, e);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket 전송 오류 - 세션: {}", session.getId(), exception);
        closeSessionSafely(session);
    }
}
