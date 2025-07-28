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
    private static final long ACTION_THROTTLE_MS = 500;

    private final Map<Integer, String> numberToSessionId = new ConcurrentHashMap<>();
    private final Map<String, Integer> sessionIdToNumber = new ConcurrentHashMap<>();

    // 지역별 마지막 채팅 메시지 정보 추적
    private final Map<String, String> regionLastChatMember = new ConcurrentHashMap<>();
    private final Map<String, Long> regionLastChatTime = new ConcurrentHashMap<>();

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

        try {
            Map<String, Object> msg = objectMapper.readValue(message.getPayload(), Map.class);

            // 타이핑 상태 메시지 처리
            if ("TYPING".equals(msg.get("type"))) {
                // 타이핑 메시지는 throttling 적용하지 않음
                // 타이핑 상태를 다른 사용자들에게 전송
                Map<String, Object> typingMessage = new HashMap<>();
                typingMessage.put("type", "TYPING");
                typingMessage.put("messageType", "TYPING");
                typingMessage.put("memberName", "익명" + sessionIdToNumber.get(session.getId()));
                typingMessage.put("id", UUID.randomUUID().toString());
                typingMessage.put("createdAt", new Date());
                typingMessage.put("isTyping", msg.get("isTyping"));

                String typingMessageJson = objectMapper.writeValueAsString(typingMessage);
                regionSessions.get(regionId).forEach((id, s) -> {
                    if (!id.equals(session.getId()) && s.isOpen()) {
                        sendMessageSafely(s, typingMessageJson);
                    }
                });
                return;
            }

            // 일반 채팅 메시지에만 throttling 적용 (0.5초)
            if (!isActionAllowed(session.getId(), "message")) {
                return;
            }

            // 빈 메시지 검증
            String content = (String) msg.get("content");
            if (content == null || content.trim().isEmpty()) {
                return;
            }

            msg.put("type", "CHAT");
            msg.put("messageType", "CHAT");
            msg.put("memberName", "익명" + sessionIdToNumber.get(session.getId()));
            msg.put("id", UUID.randomUUID().toString());
            msg.put("createdAt", new Date());
            msg.put("senderId", session.getId()); // 현재 사용자 식별용
            msg.put("isMyMessage", false); // 다른 사용자들에게는 false

            // 현재 참여자 목록 추가
            List<String> currentUsers = regionSessions.get(regionId).values().stream()
                    .map(s -> "익명" + sessionIdToNumber.get(s.getId()))
                    .collect(Collectors.toList());
            msg.put("users", currentUsers);

            // showHeader 계산 (채팅 메시지만 고려)
            boolean showHeader = true;
            String currentMemberName = "익명" + sessionIdToNumber.get(session.getId());
            long currentTime = System.currentTimeMillis();

            if (regionLastChatMember.containsKey(regionId)) {
                String lastMember = regionLastChatMember.get(regionId);
                Long lastTime = regionLastChatTime.get(regionId);

                // 같은 사용자의 연속 메시지이고 5분 이내인 경우 헤더 숨김
                if (lastMember.equals(currentMemberName) &&
                        lastTime != null &&
                        currentTime - lastTime < 300000) {
                    showHeader = false;
                }
            }

            // 현재 메시지 정보 업데이트
            regionLastChatMember.put(regionId, currentMemberName);
            regionLastChatTime.put(regionId, currentTime);

            msg.put("showHeader", showHeader);

            String messageJson = objectMapper.writeValueAsString(msg);
            regionSessions.get(regionId).forEach((id, s) -> {
                if (s.isOpen()) {
                    // 각 사용자에게 개별적으로 메시지 전송
                    if (id.equals(session.getId())) {
                        // 내가 보낸 메시지
                        Map<String, Object> myMessage = new HashMap<>(msg);
                        myMessage.put("isMyMessage", true);
                        try {
                            s.sendMessage(new TextMessage(objectMapper.writeValueAsString(myMessage)));
                        } catch (IOException e) {
                            log.error("Failed to send message to session: {}", s.getId(), e);
                        }
                    } else {
                        // 다른 사용자에게는 isMyMessage = false
                        sendMessageSafely(s, messageJson);
                    }
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
