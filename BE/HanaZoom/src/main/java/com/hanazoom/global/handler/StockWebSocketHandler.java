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
import java.util.concurrent.TimeUnit;

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
            // 삼성전자(005930) 단일 종목만 구독
            List<String> symbols = Arrays.asList("005930");
            subscribeToStocks(session, symbols);
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
            String receivedMessage = message.getPayload();
            log.info("=== KIS WebSocket 메시지 수신 ===");
            log.info("수신된 메시지: {}", receivedMessage);

            // 실시간 시세 데이터인 경우에만 처리 (구독 성공 메시지 등은 무시)
            if (receivedMessage.startsWith("0|H0STCNT0|")) {
                log.info("실시간 시세 데이터 감지 - 처리 시작");
                parseAndCachePrice(receivedMessage);
            } else {
                log.info("실시간 시세 데이터가 아님 - 무시됨");
            }
        }

        private void parseAndCachePrice(String message) {
            try {
                log.info("=== 주식 데이터 파싱 및 Redis 저장 시작 ===");
                
                // KIS 실시간 메시지 형식: 0|H0STCNT0|종목ID|현재가|변동량|변동률|...
                String[] parts = message.split("\\|");
                log.info("메시지 파싱 결과 - 총 {}개 파트", parts.length);
                
                if (parts.length >= 4) {
                    String stockId = parts[2].trim();
                    String currentPrice = parts[3].trim();
                    log.info("추출된 데이터 - 종목ID: {}, 현재가: {}", stockId, currentPrice);
                    
                    // 종목 ID를 종목코드로 변환
                    String symbol = convertStockIdToSymbol(stockId);
                    log.info("종목 ID {} → 종목코드 {} 변환", stockId, symbol);
                    
                    if (symbol != null) {
                        String key = "stock:price:" + symbol;
                        log.info("Redis 키 생성: {}", key);
                        
                        // 전체 메시지를 저장하여 상세 정보 활용
                        try {
                            // TTL 없이 데이터를 저장하여 장 마감 후에도 유지
                            redisTemplate.opsForValue().set(key, message);
                            log.info("✅ Redis 저장 성공 - 종목ID: {}, 종목코드: {}, 현재가: {}, 키: {}", stockId, symbol, currentPrice, key);
                        } catch (Exception redisException) {
                            log.error("❌ Redis 저장 실패 - stockId: {}, symbol: {}, price: {}, error: {}", stockId, symbol, currentPrice, redisException.getMessage());
                            log.error("Redis 예외 상세:", redisException);
                        }
                    } else {
                        log.warn("⚠️ 종목 ID {}에 해당하는 종목코드를 찾을 수 없음", stockId);
                    }
                } else {
                    log.warn("⚠️ 메시지 형식이 올바르지 않음 - 파트 수: {}, 메시지: {}", parts.length, message);
                }
            } catch (Exception e) {
                log.error("❌ 주식 데이터 파싱 및 저장 중 예외 발생", e);
                log.error("문제가 된 메시지: {}", message);
            }
        }

        // 종목 ID를 종목코드로 변환하는 메서드
        private String convertStockIdToSymbol(String stockId) {
            log.info("종목 ID 변환 시작: {}", stockId);
            
            try {
                int id = Integer.parseInt(stockId);
                String result = null;
                switch (id) {
                    case 1: 
                        result = "005930"; // 삼성전자
                        log.info("종목 ID {} → 삼성전자({})", stockId, result);
                        break;
                    default:
                        log.warn("⚠️ 알 수 없는 종목 ID (삼성전자 '1'이 아님): {}", stockId);
                        result = null;
                }
                log.info("종목 ID {} 변환 결과: {}", stockId, result);
                return result;
            } catch (NumberFormatException e) {
                log.warn("⚠️ 숫자로 변환할 수 없는 종목 ID: {}", stockId);
                return null;
            }
        }

        private void subscribeToStocks(WebSocketSession session, List<String> symbols) throws IOException {
            log.info("=== KIS 실시간 주식 구독 시작 ===");
            log.info("구독 요청할 종목 수: {}", symbols.size());
            log.info("구독 요청할 종목들: {}", symbols);
            
            String approvalKey = kisApiService.getRealtimeApprovalKey();
            log.info("실시간 승인키: {}", approvalKey);
            
            for (String symbol : symbols) {
                try {
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

                    String requestMessage = request.toString();
                    log.info("종목 {} 구독 요청 메시지: {}", symbol, requestMessage);
                    
                    session.sendMessage(new TextMessage(requestMessage));
                    log.info("✅ 종목 {} 구독 요청 전송 완료", symbol);
                    
                } catch (Exception e) {
                    log.error("❌ 종목 {} 구독 요청 실패", symbol, e);
                }
            }
            
            log.info("=== KIS 실시간 주식 구독 요청 완료 ===");
        }
    }
}