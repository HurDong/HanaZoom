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
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Collections;
import java.util.HashSet;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegionChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Set<Integer> recycledNumbers = Collections.synchronizedSet(new TreeSet<>());
    private int nextUserNumber = 1;
    private final Object sessionLock = new Object();
    private final Set<String> closingSessionIds = Collections.synchronizedSet(new HashSet<>());
    private final Map<String, Long> lastActionTimestamp = new ConcurrentHashMap<>();
    private static final long ACTION_THROTTLE_MS = 2000;

    // 사용자 번호와 세션 ID 매핑을 저장
    private final Map<Integer, String> numberToSessionId = new ConcurrentHashMap<>();
    private final Map<String, Integer> sessionIdToNumber = new ConcurrentHashMap<>();

    private boolean isActionAllowed(String sessionId, String action) {
        long currentTime = System.currentTimeMillis();
        String key = sessionId + "_" + action;
        Long lastTime = lastActionTimestamp.get(key);

        if (lastTime == null || currentTime - lastTime >= ACTION_THROTTLE_MS) {
            lastActionTimestamp.put(key, currentTime);
            return true;
        }
        return false;
    }

    private void cleanupSession(String sessionId) {
        lastActionTimestamp.remove(sessionId + "_connect");
        lastActionTimestamp.remove(sessionId + "_disconnect");

        // 번호 매핑 정리
        Integer number = sessionIdToNumber.remove(sessionId);
        if (number != null) {
            numberToSessionId.remove(number);
            recycledNumbers.add(number);
            log.debug("번호 {} 재사용 가능 상태로 변경 (현재 재사용 가능 번호: {})", number, recycledNumbers);
        }
    }

    private int assignUserNumber() {
        synchronized (sessionLock) {
            int userNumber;
            if (!recycledNumbers.isEmpty()) {
                // TreeSet이므로 자동으로 가장 작은 번호가 반환됨
                userNumber = recycledNumbers.iterator().next();
                recycledNumbers.remove(userNumber);
                log.debug("재사용 번호 {} 할당 (남은 재사용 가능 번호: {})", userNumber, recycledNumbers);
            } else {
                userNumber = nextUserNumber++;
                log.debug("새로운 번호 {} 할당", userNumber);
            }
            return userNumber;
        }
    }

    private void sendMessageSafely(WebSocketSession session, String message) {
        if (session != null && session.isOpen()) {
            try {
                synchronized (session) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                log.error("메시지 전송 실패 - 세션: {}", session.getId(), e);
                closeSessionSafely(session);
            } catch (IllegalStateException e) {
                log.warn("이미 닫힌 세션에 메시지 전송 시도: {}", session.getId());
                closeSessionSafely(session);
            }
        }
    }

    private void closeSessionSafely(WebSocketSession session) {
        if (session != null) {
            String sessionId = session.getId();
            // 이미 종료 처리 중인 세션은 무시
            if (!closingSessionIds.add(sessionId)) {
                return;
            }

            try {
                session.close();
            } catch (IOException e) {
                log.error("세션 종료 실패: {}", sessionId, e);
            } finally {
                sessions.remove(sessionId);
                closingSessionIds.remove(sessionId);
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

        if (!isActionAllowed(sessionId, "connect")) {
            log.warn("Too frequent connection attempt for session: {}", sessionId);
            try {
                session.close();
            } catch (IOException e) {
                log.error("Failed to close duplicate session: {}", sessionId, e);
            }
            return;
        }

        String userName;
        java.util.List<WebSocketSession> otherSessions;

        synchronized (sessionLock) {
            if (sessions.containsKey(sessionId)) {
                log.warn("Session already exists: {}", sessionId);
                return;
            }

            int userNumber = assignUserNumber();
            userName = "익명" + userNumber;

            // 번호 매핑 저장
            numberToSessionId.put(userNumber, sessionId);
            sessionIdToNumber.put(sessionId, userNumber);

            session.getAttributes().put("userNumber", userNumber);
            session.getAttributes().put("userName", userName);
            sessions.put(sessionId, session);

            otherSessions = sessions.values().stream()
                    .filter(s -> !s.getId().equals(sessionId))
                    .collect(java.util.stream.Collectors.toList());

            log.info("사용자 {} (번호: {}) 연결됨. 현재 접속자: {}, 재사용 가능 번호: {}",
                    userName, userNumber, sessions.size(), recycledNumbers);
        }

        try {
            // 새로운 사용자에게 환영 메시지 전송
            Map<String, Object> welcomeMessage = new HashMap<>();
            welcomeMessage.put("id", java.util.UUID.randomUUID().toString());
            welcomeMessage.put("type", "WELCOME");
            welcomeMessage.put("memberName", userName);
            welcomeMessage.put("content", "채팅방에 오신 것을 환영합니다!");
            welcomeMessage.put("createdAt", java.time.LocalDateTime.now().toString());

            java.util.List<String> userList = sessions.values().stream()
                    .map(s -> (String) s.getAttributes().get("userName"))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            welcomeMessage.put("users", userList);

            // 잠시 대기 후 환영 메시지 전송 (연결 안정화를 위해)
            Thread.sleep(500);
            sendMessageSafely(session, objectMapper.writeValueAsString(welcomeMessage));

            // 다른 사용자들에게 입장 알림
            Map<String, Object> enterMessage = new HashMap<>();
            enterMessage.put("id", java.util.UUID.randomUUID().toString());
            enterMessage.put("type", "ENTER");
            enterMessage.put("messageType", "ENTER");
            enterMessage.put("memberName", userName);
            enterMessage.put("content", userName + "님이 채팅방에 입장했습니다.");
            enterMessage.put("createdAt", java.time.LocalDateTime.now().toString());

            String jsonEnterMessage = objectMapper.writeValueAsString(enterMessage);
            // 잠시 대기 후 입장 메시지 브로드캐스트 (연결 안정화를 위해)
            Thread.sleep(500);
            otherSessions.forEach(s -> sendMessageSafely(s, jsonEnterMessage));
        } catch (Exception e) {
            log.error("입장 메시지 처리 실패 - 사용자: {}", userName, e);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String sessionId = session.getId();
        String userName = (String) session.getAttributes().get("userName");

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
            chatMessage.put("type", "CHAT");
            chatMessage.put("messageType", "CHAT"); // 클라이언트 호환성을 위해 유지
            chatMessage.put("memberName", userName);
            chatMessage.put("content", content);
            chatMessage.put("createdAt", java.time.LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(chatMessage);

            // 모든 사용자에게 브로드캐스트 (발신자 포함)
            sessions.forEach((id, s) -> sendMessageSafely(s, jsonMessage));
        } catch (Exception e) {
            log.error("메시지 처리 실패 - 사용자: {}, 세션: {}", userName, sessionId, e);
            closeSessionSafely(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sessionId = session.getId();

        if (!isActionAllowed(sessionId, "disconnect")) {
            log.warn("Too frequent disconnection for session: {}", sessionId);
            return;
        }

        if (!closingSessionIds.add(sessionId)) {
            return;
        }

        String userName;
        java.util.List<WebSocketSession> otherSessions;

        try {
            synchronized (sessionLock) {
                if (!sessions.containsKey(sessionId)) {
                    log.warn("Session already closed: {}", sessionId);
                    return;
                }

                Integer userNumber = sessionIdToNumber.get(sessionId);
                userName = (String) session.getAttributes().get("userName");

                if (userName == null) {
                    userName = "알 수 없는 사용자_" + sessionId;
                }

                sessions.remove(sessionId);
                cleanupSession(sessionId);

                log.info("사용자 {} (번호: {}) 연결 종료. 현재 접속자: {}, 재사용 가능 번호: {}",
                        userName, userNumber, sessions.size(), recycledNumbers);

                otherSessions = new java.util.ArrayList<>(sessions.values());
            }

            // 잠시 대기 후 퇴장 메시지 전송 (상태 안정화를 위해)
            Thread.sleep(500);

            Map<String, Object> message = new HashMap<>();
            message.put("id", java.util.UUID.randomUUID().toString());
            message.put("type", "LEAVE");
            message.put("messageType", "LEAVE");
            message.put("memberName", userName);
            message.put("content", userName + "님이 채팅방에서 나갔습니다.");
            message.put("createdAt", java.time.LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(message);
            otherSessions.forEach(s -> sendMessageSafely(s, jsonMessage));
        } catch (Exception e) {
            log.error("퇴장 메시지 처리 실패 - 세션: {}", sessionId, e);
        } finally {
            closingSessionIds.remove(sessionId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        String userName = (String) session.getAttributes().get("userName");
        log.error("전송 오류 발생 - 사용자: {}, 세션: {}", userName, session.getId(), exception);
        closeSessionSafely(session);
    }
}
