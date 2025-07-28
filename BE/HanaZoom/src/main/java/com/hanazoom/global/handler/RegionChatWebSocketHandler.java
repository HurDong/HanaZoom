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
import java.util.List;
import java.util.UUID;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegionChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    // 지역별 세션 관리를 위한 맵 추가
    private final ConcurrentHashMap<String, ConcurrentHashMap<String, WebSocketSession>> regionSessions = new ConcurrentHashMap<>();
    // 지역별 재사용 가능한 번호 관리
    private final ConcurrentHashMap<String, Set<Integer>> regionRecycledNumbers = new ConcurrentHashMap<>();
    // 지역별 다음 사용자 번호 관리
    private final ConcurrentHashMap<String, Integer> regionNextUserNumbers = new ConcurrentHashMap<>();
    private final Object sessionLock = new Object();
    private final Set<String> closingSessionIds = Collections.synchronizedSet(new HashSet<>());
    private final Map<String, Long> lastActionTimestamp = new ConcurrentHashMap<>();
    private static final long ACTION_THROTTLE_MS = 2000;

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

    private void sendMessageSafely(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
            }
        } catch (IOException e) {
            log.error("Failed to send message to session: {}", session.getId(), e);
        }
    }

    private void closeSessionSafely(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close();
            }
        } catch (IOException e) {
            log.error("Failed to close session: {}", session.getId(), e);
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String regionId = session.getUri().getQuery().split("regionId=")[1].split("&")[0];
        log.info("New WebSocket connection established for region {}: {}", regionId, session.getId());

        synchronized (sessionLock) {
            // 해당 지역의 세션 맵이 없으면 생성
            regionSessions.putIfAbsent(regionId, new ConcurrentHashMap<>());
            regionSessions.get(regionId).put(session.getId(), session);

            // 지역별 재사용 가능한 번호 초기화
            regionRecycledNumbers.putIfAbsent(regionId, Collections.synchronizedSet(new TreeSet<>()));
            regionNextUserNumbers.putIfAbsent(regionId, 1);

            // 사용자 번호 할당
            int userNumber = assignUserNumber(regionId);
            numberToSessionId.put(userNumber, session.getId());
            sessionIdToNumber.put(session.getId(), userNumber);

            log.info("Assigned user number {} to session {} in region {}", userNumber, session.getId(), regionId);

            // 현재 참여자 목록 생성
            List<String> currentUsers = regionSessions.get(regionId).values().stream()
                    .map(s -> "익명" + sessionIdToNumber.get(s.getId()))
                    .collect(Collectors.toList());

            // 환영 메시지 전송
            String username = "익명" + userNumber;
            Map<String, Object> welcomeMessage = new HashMap<>();
            welcomeMessage.put("type", "WELCOME");
            welcomeMessage.put("messageType", "WELCOME");
            welcomeMessage.put("memberName", username);
            welcomeMessage.put("content", username + "님이 채팅방에 입장했습니다.");
            welcomeMessage.put("id", UUID.randomUUID().toString());
            welcomeMessage.put("createdAt", new Date());
            welcomeMessage.put("users", currentUsers);

            // 새로운 사용자에게 환영 메시지 전송
            sendMessageSafely(session, objectMapper.writeValueAsString(welcomeMessage));

            // 다른 사용자들에게 입장 메시지 전송
            Map<String, Object> enterMessage = new HashMap<>();
            enterMessage.put("type", "ENTER");
            enterMessage.put("messageType", "ENTER");
            enterMessage.put("memberName", username);
            enterMessage.put("content", username + "님이 채팅방에 입장했습니다.");
            enterMessage.put("id", UUID.randomUUID().toString());
            enterMessage.put("createdAt", new Date());
            enterMessage.put("users", currentUsers);

            String enterMessageJson = objectMapper.writeValueAsString(enterMessage);
            regionSessions.get(regionId).forEach((id, s) -> {
                if (!id.equals(session.getId())) {
                    sendMessageSafely(s, enterMessageJson);
                }
            });
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String regionId = session.getUri().getQuery().split("regionId=")[1].split("&")[0];

        if (!isActionAllowed(session.getId(), "message")) {
            return;
        }

        try {
            Map<String, Object> msg = objectMapper.readValue(message.getPayload(), Map.class);

            // 빈 메시지 검증
            String content = (String) msg.get("content");
            if (content == null || content.trim().isEmpty()) {
                log.warn("Received empty message from session: {}", session.getId());
                return;
            }

            msg.put("type", "CHAT");
            msg.put("messageType", "CHAT");
            msg.put("memberName", "익명" + sessionIdToNumber.get(session.getId()));
            msg.put("id", UUID.randomUUID().toString());
            msg.put("createdAt", new Date());

            // 현재 참여자 목록 추가
            List<String> currentUsers = regionSessions.get(regionId).values().stream()
                    .map(s -> "익명" + sessionIdToNumber.get(s.getId()))
                    .collect(Collectors.toList());
            msg.put("users", currentUsers);

            String messageJson = objectMapper.writeValueAsString(msg);
            regionSessions.get(regionId).forEach((id, s) -> {
                if (s.isOpen()) {
                    sendMessageSafely(s, messageJson);
                }
            });
        } catch (IOException e) {
            log.error("Error handling message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        if (!isActionAllowed(session.getId(), "close") || closingSessionIds.contains(session.getId())) {
            return;
        }

        String regionId = session.getUri().getQuery().split("regionId=")[1].split("&")[0];
        log.info("WebSocket connection closed for region {}: {}", regionId, session.getId());

        synchronized (sessionLock) {
            try {
                closingSessionIds.add(session.getId());

                if (regionSessions.containsKey(regionId)) {
                    regionSessions.get(regionId).remove(session.getId());

                    // 퇴장 메시지 전송
                    int userNumber = sessionIdToNumber.getOrDefault(session.getId(), 0);
                    String username = "익명" + userNumber;

                    // 현재 참여자 목록 생성 (퇴장한 사용자 제외)
                    List<String> currentUsers = regionSessions.get(regionId).values().stream()
                            .map(s -> "익명" + sessionIdToNumber.get(s.getId()))
                            .collect(Collectors.toList());

                    Map<String, Object> leaveMessage = new HashMap<>();
                    leaveMessage.put("type", "LEAVE");
                    leaveMessage.put("messageType", "LEAVE");
                    leaveMessage.put("memberName", username);
                    leaveMessage.put("content", username + "님이 채팅방에서 나갔습니다.");
                    leaveMessage.put("id", UUID.randomUUID().toString());
                    leaveMessage.put("createdAt", new Date());
                    leaveMessage.put("users", currentUsers);

                    String leaveMessageJson = objectMapper.writeValueAsString(leaveMessage);
                    regionSessions.get(regionId).forEach((id, s) -> {
                        if (s.isOpen()) {
                            sendMessageSafely(s, leaveMessageJson);
                        }
                    });

                    // 사용자 번호 정리
                    if (userNumber > 0) {
                        regionRecycledNumbers.get(regionId).add(userNumber);
                        numberToSessionId.remove(userNumber);
                        sessionIdToNumber.remove(session.getId());
                        log.info("Recycled user number {} in region {}", userNumber, regionId);
                    }

                    // 지역에 더 이상 세션이 없으면 지역 세션 맵 제거
                    if (regionSessions.get(regionId).isEmpty()) {
                        regionSessions.remove(regionId);
                        regionRecycledNumbers.remove(regionId);
                        regionNextUserNumbers.remove(regionId);
                        log.info("Removed empty region: {}", regionId);
                    }
                }
            } finally {
                closingSessionIds.remove(session.getId());
            }
        }
    }

    private int assignUserNumber(String regionId) {
        synchronized (sessionLock) {
            Set<Integer> recycledNumbers = regionRecycledNumbers.get(regionId);
            Integer nextUserNumber = regionNextUserNumbers.get(regionId);

            if (!recycledNumbers.isEmpty()) {
                // TreeSet이므로 가장 작은 번호가 반환됨
                int userNumber = recycledNumbers.iterator().next();
                recycledNumbers.remove(userNumber);
                log.info("Reused user number {} in region {}", userNumber, regionId);
                return userNumber;
            } else {
                int userNumber = nextUserNumber;
                regionNextUserNumbers.put(regionId, nextUserNumber + 1);
                log.info("Assigned new user number {} in region {}", userNumber, regionId);
                return userNumber;
            }
        }
    }

    private void cleanupSession(String sessionId) {
        String key = sessionId + "_connect";
        lastActionTimestamp.remove(key);
        key = sessionId + "_close";
        lastActionTimestamp.remove(key);
        key = sessionId + "_message";
        lastActionTimestamp.remove(key);
    }
}
