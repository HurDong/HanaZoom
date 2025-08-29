package com.hanazoom.global.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.OrderBookItem;
import com.hanazoom.domain.stock.service.StockChartService;
import com.hanazoom.domain.stock.service.StockMinutePriceService;
import com.hanazoom.domain.stock.entity.StockMinutePrice;
import com.hanazoom.global.config.KisConfig;
import com.hanazoom.global.service.KisApiService;
import com.hanazoom.global.util.MarketTimeUtils;
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
import java.math.BigDecimal;
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
    private final StockChartService stockChartService;
    private final MarketTimeUtils marketTimeUtils;
    private final StockMinutePriceService stockMinutePriceService;

    // KIS 웹소켓 연결용
    private WebSocketSession kisWebSocketSession;

    @PostConstruct
    public void connectToKis() {
        try {
            log.info("🔄 KIS WebSocket 연결 시도 중...");
            WebSocketClient client = new StandardWebSocketClient();
            URI uri = URI.create(kisConfig.getRealtimeUrl());
            
            // 기존 세션이 있다면 정리
            if (kisWebSocketSession != null) {
                try {
                    kisWebSocketSession.close();
                } catch (Exception e) {
                    log.warn("⚠️ 기존 KIS WebSocket 세션 종료 중 오류: {}", e.getMessage());
                }
            }
            
            client.execute(new KisWebSocketHandler(), null, uri).get();
            log.info("✅ KIS WebSocket 연결 성공");

        } catch (Exception e) {
            log.error("❌ Failed to connect to KIS WebSocket", e);
            // 연결 실패 시 재시도 스케줄링
            scheduleReconnection();
        }
    }

    // 재연결 스케줄링
    private void scheduleReconnection() {
        try {
            log.info("🔄 10초 후 KIS WebSocket 재연결 시도 예정...");
            Thread.sleep(10000);
            connectToKis();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("⚠️ KIS WebSocket 재연결 스케줄링 중 인터럽트 발생");
        } catch (Exception e) {
            log.error("❌ KIS WebSocket 재연결 스케줄링 실패", e);
        }
    }

    // KIS WebSocket 세션 오류 처리
    private void handleKisSessionError() {
        try {
            log.info("🔄 KIS WebSocket 재연결 시도 중...");
            if (kisWebSocketSession != null) {
                try {
                    kisWebSocketSession.close();
                } catch (Exception e) {
                    log.warn("⚠️ 기존 KIS WebSocket 세션 종료 중 오류: {}", e.getMessage());
                }
            }
            
            // 잠시 대기 후 재연결
            Thread.sleep(2000);
            connectToKis();
        } catch (Exception e) {
            log.error("❌ KIS WebSocket 재연결 실패", e);
        }
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        clientSessions.add(session);

        // 연결 성공 메시지 전송
        sendToClient(session, createMessage("CONNECTION_ESTABLISHED", "웹소켓 연결이 성공했습니다.", null));
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();

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

        log.info("❌ 클라이언트 웹소켓 연결 종료: {} (총 {}개 연결), 상태: {}, 코드: {}, 이유: {}", session.getId(), clientSessions.size(),
                status, status.getCode(), status.getReason());
    }

    /**
     * WebSocket 세션 오류 처리 및 정리
     */
    private void handleSessionError(WebSocketSession session) {
        try {
            if (session != null) {
                // 클라이언트 세션 목록에서 제거
                clientSessions.remove(session);
                
                // 구독 목록에서 제거
                stockSubscriptions.values().forEach(sessions -> sessions.remove(session));
                
                // 세션 강제 종료
                if (session.isOpen()) {
                    session.close();
                }
                
                log.warn("⚠️ 오류 발생한 WebSocket 세션 정리 완료: {}", session.getId());
            }
        } catch (Exception e) {
            log.error("❌ 세션 오류 처리 중 추가 오류 발생: {}", session != null ? session.getId() : "null", e);
        }
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
        log.error("🚨 웹소켓 전송 오류 발생: session={}, error={}", session.getId(), exception.getMessage(), exception);
        super.handleTransportError(session, exception);
    }

    private void handleSubscription(WebSocketSession session, JSONObject message) {
        try {
            if (message.has("stockCodes")) {
                var stockCodes = message.getJSONArray("stockCodes");
                List<String> codes = new ArrayList<>();

                for (int i = 0; i < stockCodes.length(); i++) {
                    String stockCode = stockCodes.getString(i);
                    codes.add(stockCode);

                    // 이미 해당 세션이 구독 중인지 확인
                    Set<WebSocketSession> subscribers = stockSubscriptions.computeIfAbsent(stockCode,
                            k -> ConcurrentHashMap.newKeySet());
                    if (!subscribers.contains(session)) {
                        subscribers.add(session);

                    } else {

                    }
                }

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

                sendToClient(session, createMessage("UNSUBSCRIBED", "구독 해제가 완료되었습니다.", Map.of("stockCodes", codes)));
            }
        } catch (Exception e) {
            log.error("❌ 구독 해제 처리 오류", e);
        }
    }

    private void sendCachedDataToClient(WebSocketSession session, List<String> stockCodes) {
        if (session == null || !session.isOpen()) {
            log.warn("⚠️ 세션이 유효하지 않음: {}", session != null ? session.getId() : "null");
            return;
        }
        
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
                    if (session != null && session.isOpen()) {
                        synchronized (session) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(message));
                            }
                        }
                    } else {
                        deadSessions.add(session);
                    }
                } catch (IllegalStateException e) {
                    log.warn("⚠️ WebSocket 세션 상태 오류 ({}): {}", session.getId(), e.getMessage());
                    deadSessions.add(session);
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
        }
    }

    private void sendToClient(WebSocketSession session, String message) {
        try {
            if (session != null && session.isOpen()) {
                // 세션이 쓰기 가능한 상태인지 확인
                synchronized (session) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                    }
                }
            }
        } catch (IllegalStateException e) {
            log.warn("⚠️ WebSocket 세션 상태 오류 ({}): {}", session.getId(), e.getMessage());
            // 세션 상태 오류 시 해당 세션을 정리
            handleSessionError(session);
        } catch (Exception e) {
            log.error("❌ 클라이언트 메시지 전송 실패: {}", session.getId(), e);
            // 기타 오류 시에도 세션 정리
            handleSessionError(session);
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

            // 기본 종목들 구독 (프론트엔드 티커와 동일)
            List<String> defaultStocks = Arrays.asList("005930", "000660", "035420", "035720", "005380", "051910",
                    "207940", "068270", "323410", "373220");
            subscribeToDefaultStocks(session, defaultStocks);
        }

        @Override
        protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message)
                throws Exception {
            String receivedMessage = message.getPayload();

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

                connectToKis();
            }
        }

        private void subscribeToDefaultStocks(WebSocketSession session, List<String> stockCodes) {
            for (String stockCode : stockCodes) {
                try {
                    JSONObject request = createKisSubscriptionRequest(stockCode);
                    session.sendMessage(new TextMessage(request.toString()));

                } catch (Exception e) {
                    log.error("❌ KIS 기본 구독 실패: {}", stockCode, e);
                }
            }
        }

        private void handleKisRealtimeData(String message) {
            try {

                // KIS 실시간 데이터 형식: 0|H0STCNT0|001|종목코드^시간^현재가^등락구분^전일대비^등락률^...
                if (message.startsWith("0|H0STCNT0|")) {
                    String[] mainParts = message.split("\\|");
                    if (mainParts.length >= 4) {
                        // 실제 데이터는 4번째 부분에 ^ 구분자로 되어있음
                        String dataString = mainParts[3];
                        String[] dataParts = dataString.split("\\^");

                        if (dataParts.length >= 15) {
                            String stockCode = dataParts[0].trim(); // 종목코드
                            // String timeStamp = dataParts[1].trim(); // 시간
                            String currentPrice = dataParts[2].trim(); // 현재가
                            String changeSign = dataParts[3].trim(); // 등락구분 (5=하락, 2=상승, 3=보합)
                            String changePrice = dataParts[4].trim(); // 전일대비
                            String changeRate = dataParts[5].trim(); // 등락률

                            // 전일대비가 음수인 경우 KIS에서 이미 -가 붙어있음
                            // 전일대비율도 마찬가지로 이미 -가 붙어있음
                            // String weightedAvgPrice = dataParts[6].trim(); // 가중평균가
                            String openPrice = dataParts[7].trim(); // 시가
                            String highPrice = dataParts[8].trim(); // 고가
                            String lowPrice = dataParts[9].trim(); // 저가
                            String previousClose = dataParts[10].trim(); // 전일종가
                            String bidPrice = dataParts[11].trim(); // 매수호가
                            String askPrice = dataParts[12].trim(); // 매도호가
                            String volume = dataParts[13].trim(); // 누적거래량
                            // String volumeAmount = dataParts[14].trim(); // 누적거래대금

                            // 등락구분 변환 (KIS: 5=하락, 2=상승, 3=보합 → 우리 시스템: 4=하락, 2=상승, 3=보합)
                            String normalizedChangeSign = normalizeChangeSign(changeSign);

                            // 종목명은 별도 저장소에서 조회 (DB 또는 캐시)
                            String stockName = getStockNameFromCache(stockCode);

                            // 시장 운영 상태 확인
                            MarketTimeUtils.MarketTimeInfo marketInfo = marketTimeUtils.getMarketTimeInfo();
                            boolean isMarketOpen = marketInfo.isMarketOpen();
                            boolean isAfterMarketClose = marketInfo.isMarketClosed() &&
                                    !marketInfo.getMarketStatus().equals(MarketTimeUtils.MarketStatus.CLOSED_WEEKEND) &&
                                    !marketInfo.getMarketStatus().equals(MarketTimeUtils.MarketStatus.CLOSED_HOLIDAY);

                            // 장종료 후에는 현재가가 종가를 의미함
                            String displayCurrentPrice = currentPrice;
                            if (isAfterMarketClose) {

                            }

                            // 호가창 데이터 생성
                            List<OrderBookItem> askOrders = generateAskOrders(askPrice, volume);
                            List<OrderBookItem> bidOrders = generateBidOrders(bidPrice, volume);
                            
                            // 총 잔량 계산
                            String totalAskQuantity = calculateTotalQuantity(askOrders);
                            String totalBidQuantity = calculateTotalQuantity(bidOrders);
                            
                            // StockPriceResponse 객체 생성
                            StockPriceResponse stockData = StockPriceResponse.builder()
                                    .stockCode(stockCode)
                                    .stockName(stockName)
                                    .currentPrice(displayCurrentPrice)
                                    .changePrice(changePrice)
                                    .changeRate(changeRate)
                                    .changeSign(normalizedChangeSign)
                                    .volume(volume)
                                    .openPrice(openPrice)
                                    .highPrice(highPrice)
                                    .lowPrice(lowPrice)
                                    .previousClose(previousClose)
                                    .marketCap(calculateMarketCap(stockCode, currentPrice))
                                    .updatedTime(String.valueOf(System.currentTimeMillis()))
                                    // 새로 추가된 필드들
                                    .isMarketOpen(isMarketOpen)
                                    .isAfterMarketClose(isAfterMarketClose)
                                    .marketStatus(marketInfo.getStatusMessage())
                                    // 호가창 데이터
                                    .askOrders(askOrders)
                                    .bidOrders(bidOrders)
                                    .totalAskQuantity(totalAskQuantity)
                                    .totalBidQuantity(totalBidQuantity)
                                    .build();
                            
                            // 호가창 관련 계산 수행
                            stockData.calculateSpread();
                            stockData.calculateImbalanceRatio();

                            // Redis에 캐시
                            String key = "stock:realtime:" + stockCode;
                            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(stockData));

                            // 구독자들에게 브로드캐스트
                            broadcastToSubscribers(stockCode, stockData);

                            // 캔들 차트 데이터 업데이트
                            stockChartService.updateCurrentCandle(stockCode, currentPrice, volume);

                            // 분봉 데이터 업데이트 (1분, 5분, 15분)
                            try {
                                stockMinutePriceService.updateCurrentMinutePrice(stockCode, 
                                    StockMinutePrice.MinuteInterval.ONE_MINUTE, 
                                    new BigDecimal(currentPrice), 
                                    Long.parseLong(volume));
                                
                                stockMinutePriceService.updateCurrentMinutePrice(stockCode, 
                                    StockMinutePrice.MinuteInterval.FIVE_MINUTES, 
                                    new BigDecimal(currentPrice), 
                                    Long.parseLong(volume));
                                
                                stockMinutePriceService.updateCurrentMinutePrice(stockCode, 
                                    StockMinutePrice.MinuteInterval.FIFTEEN_MINUTES, 
                                    new BigDecimal(currentPrice), 
                                    Long.parseLong(volume));
                            } catch (Exception e) {
                                log.warn("⚠️ 분봉 데이터 업데이트 실패: 종목={}", stockCode, e);
                            }

                            log.info("📈 실시간 데이터 처리 완료: {} = {}원 ({}%)", stockCode, currentPrice, changeRate);
                        } else {
                            log.warn("⚠️ KIS 데이터 필드 부족: 예상 15개, 실제 {}개", dataParts.length);
                        }
                    } else {
                        log.warn("⚠️ KIS 데이터 형식 오류: mainParts.length = {}", mainParts.length);
                    }
                } else {
                    // 비실시간 메시지는 로그에서 제외
                }
            } catch (Exception e) {
                log.error("❌ KIS 실시간 데이터 처리 실패: {}", message, e);
            }
        }

        private String normalizeChangeSign(String kisChangeSign) {
            // KIS 등락구분을 우리 시스템 형식으로 변환
            switch (kisChangeSign) {
                case "2":
                    return "2"; // 상승
                case "5":
                    return "4"; // 하락 (KIS 5 → 우리 4)
                case "3":
                    return "3"; // 보합
                case "1":
                    return "1"; // 상한가
                case "4":
                    return "5"; // 하한가 (KIS 4 → 우리 5)
                default:
                    return "3"; // 기본값: 보합
            }
        }

        /**
         * 매도 호가 생성
         */
        private List<OrderBookItem> generateAskOrders(String askPrice, String volume) {
            List<OrderBookItem> askOrders = new ArrayList<>();
            try {
                long basePrice = Long.parseLong(askPrice);
                long baseVolume = Long.parseLong(volume);
                
                for (int i = 0; i < 10; i++) {
                    long price = basePrice + (i * 100); // 100원씩 증가
                    long quantity = baseVolume + (i * 1000); // 1000주씩 증가
                    
                    OrderBookItem item = OrderBookItem.builder()
                            .price(String.valueOf(price))
                            .quantity(String.valueOf(quantity))
                            .orderCount(String.valueOf(1 + i))
                            .orderType("매도")
                            .rank(i + 1)
                            .build();
                    
                    askOrders.add(item);
                    log.debug("매도호가 생성: rank={}, price={}, quantity={}", item.getRank(), item.getPrice(), item.getQuantity());
                }
            } catch (Exception e) {
                log.warn("매도 호가 생성 실패: {}", e.getMessage());
            }
            return askOrders;
        }

        /**
         * 매수 호가 생성
         */
        private List<OrderBookItem> generateBidOrders(String bidPrice, String volume) {
            List<OrderBookItem> bidOrders = new ArrayList<>();
            try {
                long basePrice = Long.parseLong(bidPrice);
                long baseVolume = Long.parseLong(volume);
                
                for (int i = 0; i < 10; i++) {
                    long price = basePrice - (i * 100); // 100원씩 감소
                    long quantity = baseVolume + (i * 1000); // 1000주씩 증가
                    
                    OrderBookItem item = OrderBookItem.builder()
                            .price(String.valueOf(price))
                            .quantity(String.valueOf(quantity))
                            .orderCount(String.valueOf(1 + i))
                            .orderType("매수")
                            .rank(i + 1)
                            .build();
                    
                    bidOrders.add(item);
                    log.debug("매수호가 생성: rank={}, price={}, quantity={}", item.getRank(), item.getPrice(), item.getQuantity());
                }
            } catch (Exception e) {
                log.warn("매수 호가 생성 실패: {}", e.getMessage());
            }
            return bidOrders;
        }

        /**
         * 총 잔량 계산
         */
        private String calculateTotalQuantity(List<OrderBookItem> orders) {
            try {
                long total = orders.stream()
                        .mapToLong(OrderBookItem::getQuantityAsLong)
                        .sum();
                return String.valueOf(total);
            } catch (Exception e) {
                log.warn("총 잔량 계산 실패: {}", e.getMessage());
                return "0";
            }
        }

        private String getStockNameFromCache(String stockCode) {
            try {
                // Redis에서 종목명 조회
                String cachedName = (String) redisTemplate.opsForValue().get("stock:name:" + stockCode);
                if (cachedName != null) {
                    return cachedName;
                }

                // 기본 종목명 매핑 (티커 종목들)
                switch (stockCode) {
                    case "005930":
                        return "삼성전자";
                    case "000660":
                        return "SK하이닉스";
                    case "035420":
                        return "NAVER";
                    case "035720":
                        return "카카오";
                    case "005380":
                        return "현대자동차";
                    case "051910":
                        return "LG화학";
                    case "207940":
                        return "삼성바이오로직스";
                    case "068270":
                        return "셀트리온";
                    case "323410":
                        return "카카오뱅크";
                    case "373220":
                        return "LG에너지솔루션";
                    // 기타 종목들
                    case "034020":
                        return "쿠팡";
                    case "042660":
                        return "대웅제약";
                    case "086790":
                        return "하나금융지주";
                    default:
                        return stockCode; // 종목코드를 그대로 반환
                }
            } catch (Exception e) {
                log.warn("⚠️ 종목명 조회 실패: {}", stockCode, e);
                return stockCode;
            }
        }

        private String calculateMarketCap(String stockCode, String currentPrice) {
            try {
                // 상장주식수는 별도 관리 필요 (간단한 예시)
                long shares = getListedShares(stockCode);
                long price = Long.parseLong(currentPrice);
                long marketCap = (shares * price) / 100000000; // 억원 단위
                return String.valueOf(marketCap);
            } catch (Exception e) {
                log.warn("⚠️ 시가총액 계산 실패: {}", stockCode, e);
                return "0";
            }
        }

        private long getListedShares(String stockCode) {
            // 주요 종목의 상장주식수 (단위: 주)
            switch (stockCode) {
                case "005930":
                    return 5969782550L; // 삼성전자
                case "000660":
                    return 731883151L; // SK하이닉스
                case "035420":
                    return 16570000L; // NAVER
                case "035720":
                    return 434265829L; // 카카오
                case "005380":
                    return 3284956600L; // 현대자동차
                case "051910":
                    return 365206200L; // LG화학
                case "207940":
                    return 119548400L; // 삼성바이오로직스
                case "068270":
                    return 865306600L; // 셀트리온
                case "323410":
                    return 2627039200L; // 카카오뱅크
                case "373220":
                    return 685074950L; // LG에너지솔루션
                default:
                    return 100000000L; // 기본값
            }
        }

    }
}