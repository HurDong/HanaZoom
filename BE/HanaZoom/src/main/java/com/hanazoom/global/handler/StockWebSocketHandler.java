package com.hanazoom.global.handler;

import com.hanazoom.global.config.KisConfig;
import com.hanazoom.global.service.KisApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.data.redis.core.RedisTemplate;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final KisApiService kisApiService;
    private final KisConfig kisConfig;
    private final RedisTemplate<String, Object> redisTemplate;

    @PostConstruct
    public void connectToKis() {
        try {
            WebSocketClient client = new StandardWebSocketClient();
            client.doHandshake(new KisWebSocketHandler(), kisConfig.getRealtimeUrl()).get();
        } catch (Exception e) {
            log.error("Failed to connect to KIS WebSocket", e);
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("New WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 이 핸들러는 클라이언트와의 연결만 관리하고, 메시지는 KIS 핸들러에서 처리 후 Redis에 저장됨
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        log.info("WebSocket connection closed: {}, status: {}", session.getId(), status);
    }

    private class KisWebSocketHandler extends TextWebSocketHandler {
        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            log.info("Successfully connected to KIS WebSocket server.");
            // 삼성전자, NAVER, 카카오, SK하이닉스, 두산에너빌리티, 한화오션, 하나금융지주
            List<String> symbols = Arrays.asList("005930", "035420", "035720", "000660", "034020", "042660", "086790");
            subscribeToStocks(session, symbols);
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
            String receivedMessage = message.getPayload();
            log.debug("Received from KIS: {}", receivedMessage);

            // 실시간 시세 데이터인 경우에만 처리 (구독 성공 메시지 등은 무시)
            if (receivedMessage.startsWith("0|H0STCNT0|")) {
                parseAndCachePrice(receivedMessage);
            }
        }

        private void parseAndCachePrice(String message) {
            try {
                String[] parts = message.split("\\|");
                if (parts.length > 2) {
                    String symbol = parts[2].trim();
                    String price = parts[3].trim();

                    String key = "stock:price:" + symbol;
                    redisTemplate.opsForValue().set(key, price);
                    log.debug("Cached price for {}: {}", symbol, price);
                }
            } catch (Exception e) {
                log.error("Failed to parse and cache stock price message: {}", message, e);
            }
        }

        private void subscribeToStocks(WebSocketSession session, List<String> symbols) throws IOException {
            String approvalKey = kisApiService.getRealtimeApprovalKey();
            for (String symbol : symbols) {
                JSONObject request = new JSONObject();
                JSONObject header = new JSONObject();
                header.put("appkey", kisConfig.getAppKey());
                header.put("appsecret", kisConfig.getAppSecret());
                header.put("authorization", "Bearer " + kisConfig.getAccessToken());
                header.put("tr_type", "1"); // 1: 실시간 등록
                header.put("custtype", "P"); // P: 개인

                JSONObject body = new JSONObject();
                JSONObject input = new JSONObject();
                input.put("tr_id", "H0STCNT0"); // 실시간 주식 현재가
                input.put("tr_key", symbol);
                body.put("input", input);

                request.put("header", header);
                request.put("body", body);

                session.sendMessage(new TextMessage(request.toString()));
                log.info("Requested subscription for symbol: {}", symbol);
            }
        }
    }
}