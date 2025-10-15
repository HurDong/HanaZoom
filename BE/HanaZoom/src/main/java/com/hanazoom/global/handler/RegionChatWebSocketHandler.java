package com.hanazoom.global.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.chat.service.RegionChatService;
import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.ArrayList;
import org.json.JSONArray;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegionChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;
    private final RegionChatService regionChatService;


    private final Map<Long, Set<WebSocketSession>> regionChatRooms = new ConcurrentHashMap<>();


    private final Map<String, Member> sessionMembers = new ConcurrentHashMap<>();


    private final Map<String, Long> sessionRegions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        log.info("🔌 지역 채팅 WebSocket 연결 시도: {}", session.getId());
        log.info("🔍 WebSocket URI: {}", session.getUri());
        log.info("🔍 WebSocket 헤더: {}", session.getHandshakeHeaders());

        String query = session.getUri().getQuery();
        log.info("🔍 쿼리 문자열: {}", query);

        if (query == null) {
            log.warn("⚠️ 쿼리 파라미터가 없습니다: {}", session.getUri());
            session.close(CloseStatus.BAD_DATA.withReason("Missing query parameters"));
            return;
        }
        
        log.info("🔌 쿼리 파라미터: {}", query);

        Map<String, String> params = parseQueryParams(query);
        String regionIdStr = params.get("regionId");
        String token = params.get("token");

        log.info("🔍 추출된 파라미터: regionId={}, token={}", regionIdStr,
                token != null ? token.substring(0, 20) + "..." : "null");

        if (regionIdStr == null || token == null) {
            log.warn("⚠️ 필수 파라미터가 누락되었습니다: regionId={}, token={}", regionIdStr, token);
            session.close(CloseStatus.BAD_DATA.withReason("Missing required parameters"));
            return;
        }

        try {
            Long regionId = Long.parseLong(regionIdStr);


            log.info("🔌 JWT 토큰 검증 시작...");
            log.info("🔌 토큰 길이: {}, 토큰 시작: {}", token.length(), token.substring(0, Math.min(50, token.length())));
            
            if (!jwtUtil.validateToken(token)) {
                log.warn("⚠️ 유효하지 않은 토큰: {}", token.substring(0, 20) + "...");
                session.close(CloseStatus.POLICY_VIOLATION.withReason("Invalid token"));
                return;
            }
            log.info("✅ JWT 토큰 검증 성공");


            UUID memberId = jwtUtil.getMemberIdFromToken(token);
            Member member = memberRepository.findById(memberId).orElse(null);

            if (member == null) {
                log.warn("⚠️ 사용자를 찾을 수 없습니다: {}", memberId);
                session.close(CloseStatus.POLICY_VIOLATION.withReason("User not found"));
                return;
            }


            Region region = regionRepository.findById(regionId).orElse(null);
            if (region == null) {
                log.warn("⚠️ 지역을 찾을 수 없습니다: {}", regionId);
                session.close(CloseStatus.POLICY_VIOLATION.withReason("Region not found"));
                return;
            }


            sessionMembers.put(session.getId(), member);
            sessionRegions.put(session.getId(), regionId);


            regionChatRooms.computeIfAbsent(regionId, k -> ConcurrentHashMap.newKeySet()).add(session);

            log.info("✅ 지역 채팅 WebSocket 연결 성공: 사용자={}, 지역={}, 세션={}",
                    member.getName(), region.getName(), session.getId());


            sendToSession(session, createMessage("PONG", "연결 성공", null));


            sendWelcomeMessage(session, member, region);


            broadcastToRegion(regionId, createSystemMessage("ENTER",
                    member.getName() + "님이 입장했습니다.", member.getName()));


            broadcastUsers(regionId);

        } catch (NumberFormatException e) {
            log.warn("⚠️ 잘못된 regionId 형식: {}", regionIdStr);
            session.close(CloseStatus.BAD_DATA.withReason("Invalid regionId format"));
        } catch (Exception e) {
            log.error("❌ 지역 채팅 WebSocket 연결 실패", e);
            log.error("❌ 연결 실패 상세 정보: regionId={}, token={}", regionIdStr, token != null ? token.substring(0, 20) + "..." : "null");
            session.close(CloseStatus.SERVER_ERROR.withReason("Connection failed"));
        }
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            JSONObject jsonMessage = new JSONObject(payload);
            String type = jsonMessage.optString("type", "CHAT");
            String content = jsonMessage.optString("content", "");
            String senderId = jsonMessage.optString("senderId", "");
            Object images = jsonMessage.opt("images");
            int imageCount = jsonMessage.optInt("imageCount", 0);
            Object portfolioStocks = jsonMessage.opt("portfolioStocks");

            Member member = sessionMembers.get(session.getId());
            Long regionId = sessionRegions.get(session.getId());

            if (member == null || regionId == null) {
                log.warn("⚠️ 세션 정보가 없습니다: {}", session.getId());
                return;
            }

            switch (type) {
                case "CHAT":
                    handleChatMessage(session, member, regionId, content, senderId, images, imageCount,
                            portfolioStocks);
                    break;
                case "TYPING":
                    handleTypingMessage(session, member, regionId, jsonMessage.optBoolean("isTyping", false));
                    break;
                case "PING":
                    sendToSession(session, createMessage("PONG", "연결 상태 양호", null));
                    break;
                default:
                    log.warn("⚠️ 알 수 없는 메시지 타입: {}", type);
            }

        } catch (Exception e) {
            log.error("❌ 지역 채팅 메시지 처리 오류", e);
            sendToSession(session, createMessage("ERROR", "메시지 처리 중 오류가 발생했습니다.", null));
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) throws Exception {
        Member member = sessionMembers.get(session.getId());
        Long regionId = sessionRegions.get(session.getId());

        if (member != null && regionId != null) {
            log.info("❌ 지역 채팅 WebSocket 연결 종료: 사용자={}, 지역={}, 상태={}",
                    member.getName(), regionId, status);


            Set<WebSocketSession> roomSessions = regionChatRooms.get(regionId);
            if (roomSessions != null) {
                roomSessions.remove(session);
                if (roomSessions.isEmpty()) {
                    regionChatRooms.remove(regionId);
                }
            }


            broadcastToRegion(regionId, createSystemMessage("LEAVE",
                    member.getName() + "님이 퇴장했습니다.", member.getName()));


            broadcastUsers(regionId);
        }


        sessionMembers.remove(session.getId());
        sessionRegions.remove(session.getId());
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
        log.error("🚨 지역 채팅 WebSocket 전송 오류: session={}, error={}",
                session.getId(), exception.getMessage(), exception);
        super.handleTransportError(session, exception);
    }

    private void handleChatMessage(WebSocketSession session, Member member, Long regionId, String content,
            String senderId, Object images, int imageCount, Object portfolioStocks) {
        if ((content == null || content.trim().isEmpty()) && imageCount == 0 && portfolioStocks == null) {
            return;
        }


        String messageId = UUID.randomUUID().toString();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));


        List<String> imageList = null;
        if (images != null && imageCount > 0) {
            try {
                if (images instanceof JSONArray) {
                    JSONArray arr = (JSONArray) images;
                    imageList = new ArrayList<>();
                    for (int i = 0; i < arr.length(); i++) {
                        imageList.add(arr.getString(i));
                    }
                } else if (images instanceof Collection) {
                    imageList = new ArrayList<>((Collection<String>) images);
                }
            } catch (Exception e) {
                log.warn("⚠️ 이미지 변환 실패", e);
            }
        }


        List<Map<String, Object>> portfolioList = null;
        if (portfolioStocks != null) {
            try {
                portfolioList = new ArrayList<>();

                if (portfolioStocks instanceof JSONArray) {
                    JSONArray arr = (JSONArray) portfolioStocks;
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        Map<String, Object> map = objectMapper.readValue(
                                obj.toString(), new TypeReference<Map<String, Object>>() {
                                });
                        portfolioList.add(map);
                    }
                } else if (portfolioStocks instanceof String) {
                    JSONArray arr = new JSONArray((String) portfolioStocks);
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        Map<String, Object> map = objectMapper.readValue(
                                obj.toString(), new TypeReference<Map<String, Object>>() {
                                });
                        portfolioList.add(map);
                    }
                } else if (portfolioStocks instanceof Collection) {
                    String json = objectMapper.writeValueAsString(portfolioStocks);
                    portfolioList = objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {
                    });
                }
            } catch (Exception e) {
                log.warn("⚠️ 보유종목 변환 실패", e);
                portfolioList = new ArrayList<>();
            }
        }


        final List<String> finalImageList = imageList;
        final List<Map<String, Object>> finalPortfolioList = portfolioList;
        String finalSenderId = senderId.isEmpty() ? member.getId().toString() : senderId;

        try {
            regionChatService.saveChatMessage(
                    messageId,
                    regionId,
                    finalSenderId,
                    member.getName(),
                    content,
                    "CHAT",
                    finalImageList,
                    imageCount > 0 ? imageCount : null,
                    finalPortfolioList);
        } catch (Exception e) {
            log.error("❌ 채팅 메시지 저장 실패 (무시하고 계속)", e);
        }


        Set<WebSocketSession> sessions = regionChatRooms.get(regionId);
        if (sessions != null) {
            List<WebSocketSession> deadSessions = new ArrayList<>();

            for (WebSocketSession targetSession : sessions) {
                try {
                    if (targetSession.isOpen()) {

                        boolean isMyMessage = targetSession.equals(session);

                        Map<String, Object> chatMessage = new HashMap<>();
                        chatMessage.put("id", messageId);
                        chatMessage.put("type", "CHAT");
                        chatMessage.put("messageType", "CHAT");
                        chatMessage.put("memberName", member.getName());
                        chatMessage.put("content", content);
                        chatMessage.put("createdAt", timestamp);
                        chatMessage.put("isMyMessage", isMyMessage);
                        chatMessage.put("senderId", finalSenderId);


                        if (images != null && imageCount > 0) {
                            chatMessage.put("images", images);
                            chatMessage.put("imageCount", imageCount);
                        }


                        if (finalPortfolioList != null && !finalPortfolioList.isEmpty()) {
                            chatMessage.put("portfolioStocks", finalPortfolioList);
                        }

                        synchronized (targetSession) {
                            if (targetSession.isOpen()) {
                                targetSession
                                        .sendMessage(new TextMessage(objectMapper.valueToTree(chatMessage).toString()));
                            }
                        }
                    } else {
                        deadSessions.add(targetSession);
                    }
                } catch (Exception e) {
                    log.error("❌ 지역 채팅 메시지 전송 실패: {}", targetSession.getId(), e);
                    deadSessions.add(targetSession);
                }
            }


            deadSessions.forEach(sessions::remove);
        }
    }

    private void handleTypingMessage(WebSocketSession session, Member member, Long regionId, boolean isTyping) {
        Map<String, Object> typingMessage = new HashMap<>();
        typingMessage.put("type", "TYPING");
        typingMessage.put("memberName", member.getName());
        typingMessage.put("isTyping", isTyping);


        broadcastToRegionExcept(regionId, session, objectMapper.valueToTree(typingMessage).toString());
    }

    private void sendWelcomeMessage(WebSocketSession session, Member member, Region region) {
        Map<String, Object> welcomeMessage = new HashMap<>();
        welcomeMessage.put("id", UUID.randomUUID().toString());
        welcomeMessage.put("type", "WELCOME");
        welcomeMessage.put("messageType", "WELCOME");
        welcomeMessage.put("memberName", member.getName());
        welcomeMessage.put("content", member.getName() + "님, " + region.getName() + " 채팅방에 오신 것을 환영합니다!");
        welcomeMessage.put("createdAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        welcomeMessage.put("showHeader", false);

        sendToSession(session, objectMapper.valueToTree(welcomeMessage).toString());
    }

    private void broadcastUsers(Long regionId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "USERS");
            payload.put("users", getOnlineUsers(regionId));
            String message = objectMapper.writeValueAsString(payload);

            Set<WebSocketSession> sessions = regionChatRooms.get(regionId);
            if (sessions != null && !sessions.isEmpty()) {
                List<WebSocketSession> deadSessions = new ArrayList<>();

                for (WebSocketSession session : sessions) {
                    try {
                        if (session != null && session.isOpen()) {
                            synchronized (session) {
                                if (session.isOpen()) {
                                    session.sendMessage(new TextMessage(message));
                                    log.debug("✅ 사용자 목록 브로드캐스트 성공: {}", session.getId());
                                } else {
                                    deadSessions.add(session);
                                }
                            }
                        } else {
                            deadSessions.add(session);
                        }
                    } catch (IllegalStateException e) {
                        log.warn("⚠️ WebSocket 세션이 닫혀있어 사용자 목록 전송 불가 (무시): {}", session.getId());
                        deadSessions.add(session);
                    } catch (Exception e) {
                        log.warn("❌ 사용자 목록 브로드캐스트 실패 (무시): {}", session.getId());
                        deadSessions.add(session);
                    }
                }

                deadSessions.forEach(sessions::remove);
                if (!deadSessions.isEmpty()) {
                    log.info("🧹 사용자 목록 브로드캐스트 중 정리된 죽은 세션 수: {}", deadSessions.size());
                }
            }
        } catch (Exception e) {
            log.error("❌ 온라인 사용자 목록 브로드캐스트 실패", e);
        }
    }

    private void broadcastToRegion(Long regionId, String message) {
        Set<WebSocketSession> sessions = regionChatRooms.get(regionId);
        if (sessions != null && !sessions.isEmpty()) {
            List<WebSocketSession> deadSessions = new ArrayList<>();

            for (WebSocketSession session : sessions) {
                try {
                    if (session != null && session.isOpen()) {
                        synchronized (session) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(message));
                                log.debug("✅ 메시지 브로드캐스트 성공: {}", session.getId());
                            } else {
                                deadSessions.add(session);
                            }
                        }
                    } else {
                        deadSessions.add(session);
                    }
                } catch (IllegalStateException e) {
                    log.warn("⚠️ WebSocket 세션이 닫혀있어 메시지 전송 불가 (무시): {}", session.getId());
                    deadSessions.add(session);
                } catch (Exception e) {
                    log.error("❌ 지역 채팅 메시지 전송 실패: {}", session.getId(), e);
                    deadSessions.add(session);
                }
            }

            deadSessions.forEach(sessions::remove);
            if (!deadSessions.isEmpty()) {
                log.info("🧹 정리된 죽은 세션 수: {}", deadSessions.size());
            }
        }
    }

    private void broadcastToRegionExcept(Long regionId, WebSocketSession excludeSession, String message) {
        Set<WebSocketSession> sessions = regionChatRooms.get(regionId);
        if (sessions != null) {
            List<WebSocketSession> deadSessions = new ArrayList<>();

            for (WebSocketSession session : sessions) {
                if (session.equals(excludeSession)) {
                    continue; 
                }

                try {
                    if (session.isOpen()) {
                        synchronized (session) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(message));
                            }
                        }
                    } else {
                        deadSessions.add(session);
                    }
                } catch (Exception e) {
                    log.error("❌ 지역 채팅 메시지 전송 실패: {}", session.getId(), e);
                    deadSessions.add(session);
                }
            }


            deadSessions.forEach(sessions::remove);
        }
    }

    private void sendToSession(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                synchronized (session) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ 세션 메시지 전송 실패: {}", session.getId(), e);
        }
    }

    private String createMessage(String type, String message, Object data) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("type", type);
            response.put("message", message);
            response.put("timestamp", System.currentTimeMillis());
            if (data != null) {
                response.put("data", data);
            }
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            log.error("❌ 메시지 생성 실패", e);
            return "{\"type\":\"ERROR\",\"message\":\"메시지 생성 실패\"}";
        }
    }

    private String createSystemMessage(String messageType, String content, String memberName) {
        Map<String, Object> message = new HashMap<>();
        message.put("id", UUID.randomUUID().toString());
        message.put("type", messageType);
        message.put("messageType", messageType);
        message.put("memberName", memberName);
        message.put("content", content);
        message.put("createdAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        message.put("showHeader", false);

        try {
            return objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("❌ 시스템 메시지 생성 실패", e);
            return "{\"type\":\"ERROR\",\"message\":\"시스템 메시지 생성 실패\"}";
        }
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2) {
                params.put(keyValue[0], keyValue[1]);
            }
        }
        return params;
    }


    public int getOnlineUserCount(Long regionId) {
        Set<WebSocketSession> sessions = regionChatRooms.get(regionId);
        return sessions != null ? sessions.size() : 0;
    }


    public List<String> getOnlineUsers(Long regionId) {
        Set<WebSocketSession> sessions = regionChatRooms.get(regionId);
        if (sessions == null) {
            return new ArrayList<>();
        }

        List<String> users = new ArrayList<>();
        for (WebSocketSession session : sessions) {
            Member member = sessionMembers.get(session.getId());
            if (member != null) {
                users.add(member.getName());
            }
        }
        return users;
    }
}