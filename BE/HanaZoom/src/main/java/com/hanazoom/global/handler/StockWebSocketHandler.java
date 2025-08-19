package com.hanazoom.global.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.global.config.KisConfig;
import com.hanazoom.global.service.KisApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.data.redis.core.RedisTemplate;

import javax.annotation.PostConstruct;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> clientSessions = new CopyOnWriteArrayList<>();
    private final Map<String, Set<WebSocketSession>> stockSubscriptions = new ConcurrentHashMap<>();
    private final KisApiService kisApiService;
    private final KisConfig kisConfig;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // KIS 웹소켓 연결용
    private WebSocketSession kisWebSocketSession;

    @PostConstruct
    public void connectToKis() {
        try {
            WebSocketClient client = new StandardWebSocketClient();
            URI uri = URI.create(kisConfig.getRealtimeUrl());
            client.execute(new KisWebSocketHandler(), null, uri).get();
            log.info("🚀 KIS WebSocket connection initiated");
        } catch (Exception e) {
            log.error("❌ Failed to connect to KIS WebSocket", e);
        }
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        clientSessions.add(session);
        log.info("✅ 새 클라이언트 웹소켓 연결: {} (총 {}개 연결)", session.getId(), clientSessions.size());

        // 연결 성공 메시지 전송
        sendToClient(session, createMessage("CONNECTION_ESTABLISHED", "웹소켓 연결이 성공했습니다.", null));
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            log.debug("📨 클라이언트 메시지 수신: {}", payload);

            JSONObject jsonMessage = new JSONObject(payload);
            String type = jsonMessage.getString("type");

            switch (type) {
                case "SUBSCRIBE":
                    handleSubscription(session, jsonMessage);
                    break;
                case "UNSUBSCRIBE":
                    handleUnsubscription(session, jsonMessage);
                    break;
                case "PING":
                    sendToClient(session, createMessage("PONG", "연결 상태 양호", null));
                    break;
                default:
                    log.warn("⚠️ 알 수 없는 메시지 타입: {}", type);
            }
        } catch (Exception e) {
            log.error("❌ 클라이언트 메시지 처리 오류", e);
            sendToClient(session, createMessage("ERROR", "메시지 처리 중 오류가 발생했습니다.", null));
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) throws Exception {
        clientSessions.remove(session);

        // 구독 정리
        stockSubscriptions.values().forEach(sessions -> sessions.remove(session));

        log.info("❌ 클라이언트 웹소켓 연결 종료: {} (총 {}개 연결), 상태: {}",
                session.getId(), clientSessions.size(), status);
    }

    private void handleSubscription(WebSocketSession session, JSONObject message) {
        try {
            if (message.has("stockCodes")) {
                var stockCodes = message.getJSONArray("stockCodes");
                List<String> codes = new ArrayList<>();

                for (int i = 0; i < stockCodes.length(); i++) {
                    String stockCode = stockCodes.getString(i);
                    codes.add(stockCode);

                    // 구독 맵에 세션 추가
                    stockSubscriptions.computeIfAbsent(stockCode, k -> ConcurrentHashMap.newKeySet()).add(session);
                }

                log.info("📡 클라이언트 {}가 종목 구독: {}", session.getId(), codes);

                // KIS 웹소켓에 구독 요청 (이미 구독된 종목은 제외)
                subscribeToKisWebSocket(codes);

                // 구독 성공 응답
                sendToClient(session, createMessage("SUBSCRIBED", "구독이 완료되었습니다.", Map.of("stockCodes", codes)));

                // Redis에서 현재 캐시된 데이터 즉시 전송
                sendCachedDataToClient(session, codes);
            }
        } catch (Exception e) {
            log.error("❌ 구독 처리 오류", e);
            sendToClient(session, createMessage("ERROR", "구독 처리 중 오류가 발생했습니다.", null));
        }
    }

    private void handleUnsubscription(WebSocketSession session, JSONObject message) {
        try {
            if (message.has("stockCodes")) {
                var stockCodes = message.getJSONArray("stockCodes");
                List<String> codes = new ArrayList<>();

                for (int i = 0; i < stockCodes.length(); i++) {
                    String stockCode = stockCodes.getString(i);
                    codes.add(stockCode);

                    // 구독 맵에서 세션 제거
                    Set<WebSocketSession> sessions = stockSubscriptions.get(stockCode);
                    if (sessions != null) {
                        sessions.remove(session);
                        if (sessions.isEmpty()) {
                            stockSubscriptions.remove(stockCode);
                        }
                    }
                }

                log.info("📴 클라이언트 {}가 종목 구독 해제: {}", session.getId(), codes);
                sendToClient(session, createMessage("UNSUBSCRIBED", "구독 해제가 완료되었습니다.", Map.of("stockCodes", codes)));
            }
        } catch (Exception e) {
            log.error("❌ 구독 해제 처리 오류", e);
        }
    }

    private void sendCachedDataToClient(WebSocketSession session, List<String> stockCodes) {
        for (String stockCode : stockCodes) {
            try {
                String cachedData = (String) redisTemplate.opsForValue().get("stock:realtime:" + stockCode);
                if (cachedData != null) {
                    StockPriceResponse stockData = objectMapper.readValue(cachedData, StockPriceResponse.class);
                    sendToClient(session, createMessage("STOCK_UPDATE", "실시간 주식 데이터", Map.of("stockData", stockData)));
                }
            } catch (Exception e) {
                log.error("❌ 캐시된 데이터 전송 오류: {}", stockCode, e);
            }
        }
    }

    private void subscribeToKisWebSocket(List<String> stockCodes) {
        if (kisWebSocketSession != null && kisWebSocketSession.isOpen()) {
            for (String stockCode : stockCodes) {
                // 이미 구독 중인지 확인
                if (!stockSubscriptions.containsKey(stockCode) || stockSubscriptions.get(stockCode).isEmpty()) {
                    continue; // 다른 클라이언트가 이미 구독 중
                }

                try {
                    JSONObject request = createKisSubscriptionRequest(stockCode);
                    kisWebSocketSession.sendMessage(new TextMessage(request.toString()));
                    log.info("📡 KIS에 종목 구독 요청: {}", stockCode);
                } catch (Exception e) {
                    log.error("❌ KIS 구독 요청 실패: {}", stockCode, e);
                }
            }
        } else {
            log.warn("⚠️ KIS 웹소켓이 연결되지 않음");
        }
    }

    private JSONObject createKisSubscriptionRequest(String stockCode) {
        JSONObject request = new JSONObject();
        JSONObject header = new JSONObject();

        header.put("approval_key", kisApiService.getRealtimeApprovalKey());
        header.put("custtype", "P");
        header.put("tr_type", "1");
        header.put("content-type", "utf-8");

        JSONObject body = new JSONObject();
        JSONObject input = new JSONObject();
        input.put("tr_id", "H0STCNT0");
        input.put("tr_key", stockCode);

        body.put("input", input);
        request.put("header", header);
        request.put("body", body);

        return request;
    }

    private void broadcastToSubscribers(String stockCode, Object stockData) {
        Set<WebSocketSession> subscribers = stockSubscriptions.get(stockCode);
        if (subscribers != null && !subscribers.isEmpty()) {
            String message = createMessage("STOCK_UPDATE", "실시간 주식 데이터", Map.of("stockData", stockData));

            List<WebSocketSession> deadSessions = new ArrayList<>();
            for (WebSocketSession session : subscribers) {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                    } else {
                        deadSessions.add(session);
                    }
                } catch (Exception e) {
                    log.error("❌ 클라이언트에게 데이터 전송 실패: {}", session.getId(), e);
                    deadSessions.add(session);
                }
            }

            // 죽은 세션들 정리
            deadSessions.forEach(subscribers::remove);
            if (subscribers.isEmpty()) {
                stockSubscriptions.remove(stockCode);
            }

            if (subscribers.size() > 0) {
                log.debug("📈 {} 구독자들에게 데이터 브로드캐스트: {}명", stockCode, subscribers.size());
            }
        }
    }

    private void sendToClient(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
            }
        } catch (Exception e) {
            log.error("❌ 클라이언트 메시지 전송 실패: {}", session.getId(), e);
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

    // KIS 웹소켓으로부터 데이터를 수신하는 핸들러
    private class KisWebSocketHandler extends TextWebSocketHandler {
        @Override
        public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
            kisWebSocketSession = session;
            log.info("✅ KIS 웹소켓 연결 성공");

            // 기본 종목들 구독 (삼성전자, NAVER, 카카오, SK하이닉스 등)
            List<String> defaultStocks = Arrays.asList("005930", "035420", "035720", "000660", "034020", "042660",
                    "086790");
            subscribeToDefaultStocks(session, defaultStocks);
        }

        @Override
        protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message)
                throws Exception {
            String receivedMessage = message.getPayload();
            log.debug("📨 KIS로부터 수신: {}", receivedMessage);

            // 실시간 시세 데이터 처리
            if (receivedMessage.startsWith("0|H0STCNT0|")) {
                handleKisRealtimeData(receivedMessage);
            }
        }

        @Override
        public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception)
                throws Exception {
            log.error("❌ KIS 웹소켓 전송 오류", exception);
        }

        @Override
        public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status)
                throws Exception {
            log.warn("❌ KIS 웹소켓 연결 종료: {}", status);
            kisWebSocketSession = null;

            // 자동 재연결 시도
            if (status.getCode() != CloseStatus.NORMAL.getCode()) {
                log.info("🔄 KIS 웹소켓 재연결 시도...");
                connectToKis();
            }
        }

        private void subscribeToDefaultStocks(WebSocketSession session, List<String> stockCodes) {
            for (String stockCode : stockCodes) {
                try {
                    JSONObject request = createKisSubscriptionRequest(stockCode);
                    session.sendMessage(new TextMessage(request.toString()));
                    log.info("📡 KIS 기본 종목 구독: {}", stockCode);
                } catch (Exception e) {
                    log.error("❌ KIS 기본 구독 실패: {}", stockCode, e);
                }
            }
        }

        private void handleKisRealtimeData(String message) {
            try {
                String[] parts = message.split("\\|");
                if (parts.length > 10) {
                    String stockCode = parts[3].trim(); // 종목코드
                    String currentPrice = parts[4].trim(); // 현재가
                    String changePrice = parts[5].trim(); // 전일대비가격
                    String changeRate = parts[6].trim(); // 전일대비율
                    String changeSign = parts[7].trim(); // 등락구분
                    String volume = parts[8].trim(); // 누적거래량

                    // StockPriceResponse 객체 생성
                    StockPriceResponse stockData = StockPriceResponse.builder()
                            .stockCode(stockCode)
                            .stockName("") // KIS에서 제공하지 않음
                            .currentPrice(currentPrice)
                            .changePrice(changePrice)
                            .changeRate(changeRate)
                            .changeSign(changeSign)
                            .volume(volume)
                            .updatedTime(String.valueOf(System.currentTimeMillis()))
                            .build();

                    // Redis에 캐시
                    String key = "stock:realtime:" + stockCode;
                    redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(stockData));

                    // 구독자들에게 브로드캐스트
                    broadcastToSubscribers(stockCode, stockData);

                    log.debug("📈 실시간 데이터 처리 완료: {} = {}원 ({}%)", stockCode, currentPrice, changeRate);
                }
            } catch (Exception e) {
                log.error("❌ KIS 실시간 데이터 처리 실패: {}", message, e);
            }
        }
    }
}