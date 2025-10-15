package com.hanazoom.global.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.OrderBookItem;
import com.hanazoom.domain.stock.dto.OrderBookResponse;
import java.time.Duration;
import com.hanazoom.domain.stock.service.StockChartService;
import com.hanazoom.domain.stock.service.StockMinutePriceService;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.domain.stock.service.KafkaStockService;
import com.hanazoom.domain.stock.entity.StockMinutePrice;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import org.springframework.context.ApplicationEventPublisher;
import com.hanazoom.domain.order.event.OrderMatchingEvent;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Random;
import org.springframework.scheduling.annotation.Scheduled;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> clientSessions = new CopyOnWriteArrayList<>();
    private final Map<String, Set<WebSocketSession>> stockSubscriptions = new ConcurrentHashMap<>();
    private final KisApiService kisApiService;
    private final KisConfig kisConfig;
    private final RedisTemplate<String, Object> redisTemplate;
    private final KafkaStockService kafkaStockService;
    private final ObjectMapper objectMapper;
    private final StockChartService stockChartService;
    private final MarketTimeUtils marketTimeUtils;
    private final StockMinutePriceService stockMinutePriceService;
    private final StockService stockService;
    private final StockRepository stockRepository;
    private final ApplicationEventPublisher eventPublisher;


    private WebSocketSession kisWebSocketSession;


    private boolean marketClosedToday = false;
    

    private boolean isRedisConnectionAvailable() {
        try {
            redisTemplate.opsForValue().get("connection_test");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @PostConstruct
    public void connectToKis() {
        try {
            log.info("🔄 KIS WebSocket 연결 시도 중...");
            WebSocketClient client = new StandardWebSocketClient();
            URI uri = URI.create(kisConfig.getRealtimeUrl());
            

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

            scheduleReconnection();
        }
    }


    private void scheduleReconnection() {
        try {
            log.info("🔄 10초 후 KIS WebSocket 재연결 시도 예정...");

            new Thread(() -> {
                try {
                    Thread.sleep(10000);
                    connectToKis();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("⚠️ KIS WebSocket 재연결 스케줄링 중 인터럽트 발생");
                } catch (Exception e) {
                    log.error("❌ KIS WebSocket 재연결 스케줄링 실패", e);
                }
            }).start();
        } catch (Exception e) {
            log.error("❌ KIS WebSocket 재연결 스케줄링 시작 실패", e);
        }
    }


    private void handleKisSessionError() {
        try {
            log.info("🔄 KIS WebSocket 재연결 시도 중...");
            

            if (!isRedisConnectionAvailable()) {
                log.warn("⚠️ Redis 연결이 불안정합니다. 웹소켓 재연결을 지연합니다.");

                scheduleReconnection();
                return;
            }
            
            if (kisWebSocketSession != null) {
                try {
                    kisWebSocketSession.close();
                } catch (Exception e) {
                    log.warn("⚠️ 기존 KIS WebSocket 세션 종료 중 오류: {}", e.getMessage());
                }
                kisWebSocketSession = null;
            }
            

            Thread.sleep(2000);
            connectToKis();
        } catch (Exception e) {
            log.error("❌ KIS WebSocket 재연결 실패", e);

            scheduleReconnection();
        }
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        clientSessions.add(session);
        
        log.info("✅ 클라이언트 WebSocket 연결 성공: 세션={}, 총연결수={}", 
            session.getId(), clientSessions.size());


        sendToClient(session, createMessage("CONNECTION_ESTABLISHED", "웹소켓 연결이 성공했습니다.", null));
        
        log.info("📤 CONNECTION_ESTABLISHED 메시지 전송 완료: 세션={}", session.getId());
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            log.info("📥 클라이언트 메시지 수신: 세션={}, 메시지={}", session.getId(), payload);

            JSONObject jsonMessage = new JSONObject(payload);
            String type = jsonMessage.getString("type");

            log.info("📨 메시지 타입: {}, 세션={}", type, session.getId());

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


        stockSubscriptions.values().forEach(sessions -> sessions.remove(session));

        log.info("❌ 클라이언트 웹소켓 연결 종료: {} (총 {}개 연결), 상태: {}, 코드: {}, 이유: {}", session.getId(), clientSessions.size(),
                status, status.getCode(), status.getReason());
    }

    private void handleSessionError(WebSocketSession session) {
        try {
            if (session != null) {

                clientSessions.remove(session);
                

                stockSubscriptions.values().forEach(sessions -> sessions.remove(session));
                

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

                log.info("📡 구독 요청 수신: 세션={}, 종목수={}", session.getId(), stockCodes.length());

                for (int i = 0; i < stockCodes.length(); i++) {
                    String stockCode = stockCodes.getString(i);
                    codes.add(stockCode);


                    Set<WebSocketSession> subscribers = stockSubscriptions.computeIfAbsent(stockCode,
                            k -> ConcurrentHashMap.newKeySet());
                    if (!subscribers.contains(session)) {
                        subscribers.add(session);
                        log.info("✅ 새 구독 추가: 세션={}, 종목={}, 총구독자수={}", 
                            session.getId(), stockCode, subscribers.size());
                    } else {
                        log.info("ℹ️ 이미 구독 중: 세션={}, 종목={}", session.getId(), stockCode);
                    }
                }


                subscribeToKisWebSocket(codes);


                sendToClient(session, createMessage("SUBSCRIBED", "구독이 완료되었습니다.", Map.of("stockCodes", codes)));


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
        
        log.info("📤 캐시된 데이터 전송 시작: 세션={}, 종목수={}", session.getId(), stockCodes.size());
        
        for (String stockCode : stockCodes) {
            try {

                String cachedData = (String) redisTemplate.opsForValue().get("stock:realtime:" + stockCode);
                

                if (cachedData == null) {
                    cachedData = (String) redisTemplate.opsForValue().get("stock:closing:" + stockCode);
                    if (cachedData != null) {
                        log.info("📊 장종료 종가 데이터 사용: 종목={}", stockCode);
                    }
                }
                
                if (cachedData != null) {
                    StockPriceResponse stockData = objectMapper.readValue(cachedData, StockPriceResponse.class);
                    log.info("📤 캐시된 데이터 전송: 세션={}, 종목={}, 현재가={}, 데이터길이={}", 
                        session.getId(), stockCode, stockData.getCurrentPrice(), cachedData.length());
                    log.info("📊 캐시된 데이터 상세: 종목={}, 현재가={}, 전일대비={}, 등락률={}", 
                        stockCode, stockData.getCurrentPrice(), stockData.getChangePrice(), stockData.getChangeRate());
                    sendToClient(session, createMessage("STOCK_UPDATE", "실시간 주식 데이터", Map.of("stockData", stockData)));
                } else {
                    log.warn("⚠️ 캐시된 데이터 없음: 종목={}", stockCode);
                }
            } catch (Exception e) {
                log.error("❌ 캐시된 데이터 전송 오류: {}", stockCode, e);
            }
        }
    }

    private void subscribeToKisWebSocket(List<String> stockCodes) {
        if (kisWebSocketSession != null && kisWebSocketSession.isOpen()) {
            for (String stockCode : stockCodes) {

                if (!stockSubscriptions.containsKey(stockCode) || stockSubscriptions.get(stockCode).isEmpty()) {
                    continue; 
                }

                try {
                    JSONObject request = createKisSubscriptionRequest(stockCode);

                    synchronized (kisWebSocketSession) {
                        if (kisWebSocketSession.isOpen()) {
                            kisWebSocketSession.sendMessage(new TextMessage(request.toString()));
                            log.debug("✅ KIS 구독 요청 성공: {}", stockCode);
                        } else {
                            log.warn("⚠️ KIS WebSocket 세션이 닫혀있음: {}", stockCode);
                            handleKisSessionError();
                            break; 
                        }
                    }
                } catch (IllegalStateException e) {
                    log.warn("⚠️ KIS WebSocket 세션 상태 오류 ({}): {}", stockCode, e.getMessage());
                    handleKisSessionError();
                    break; 
                } catch (Exception e) {
                    log.error("❌ KIS 구독 요청 실패: {}", stockCode, e);

                    if (e.getMessage().contains("TEXT_PARTIAL_WRITING") || 
                        e.getMessage().contains("remote endpoint")) {
                        handleKisSessionError();
                        break;
                    }
                }
            }
        } else {
            log.warn("⚠️ KIS 웹소켓이 연결되지 않음 - 재연결 시도");
            handleKisSessionError();
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
            int successCount = 0;
            int failCount = 0;
            
            for (WebSocketSession session : subscribers) {
                try {
                    if (session != null && session.isOpen()) {
                        synchronized (session) {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(message));
                                successCount++;
                                log.debug("✅ 실시간 데이터 전송 성공: 세션={}, 종목={}", session.getId(), stockCode);
                            } else {
                                deadSessions.add(session);
                                failCount++;
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


            deadSessions.forEach(subscribers::remove);
            if (subscribers.isEmpty()) {
                stockSubscriptions.remove(stockCode);
            }
            

            log.info("📡 브로드캐스트 완료: 종목={}, 성공={}, 실패={}, 총구독자={}", 
                stockCode, successCount, failCount, subscribers.size());
        } else {
            log.debug("📡 브로드캐스트 건너뜀: 종목={}, 구독자 없음", stockCode);
        }
    }

    private void sendToClient(WebSocketSession session, String message) {
        try {
            if (session != null && session.isOpen()) {

                synchronized (session) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                    }
                }
            }
        } catch (IllegalStateException e) {
            log.warn("⚠️ WebSocket 세션 상태 오류 ({}): {}", session.getId(), e.getMessage());

            handleSessionError(session);
        } catch (Exception e) {
            log.error("❌ 클라이언트 메시지 전송 실패: {}", session.getId(), e);

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


    private class KisWebSocketHandler extends TextWebSocketHandler {
        @Override
        public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
            kisWebSocketSession = session;


            List<String> defaultStocks = Arrays.asList("005930", "000660", "035420", "035720", "005380", "051910",
                    "207940", "068270", "323410", "373220");
            subscribeToDefaultStocks(session, defaultStocks);
        }

        @Override
        protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message)
                throws Exception {
            String receivedMessage = message.getPayload();


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


            if (status.getCode() != CloseStatus.NORMAL.getCode()) {
                log.info("🔄 KIS WebSocket 비정상 종료로 인한 재연결 시도");
                

                if (isRedisConnectionAvailable()) {
                    scheduleReconnection();
                } else {
                    log.warn("⚠️ Redis 연결이 불안정하여 웹소켓 재연결을 지연합니다.");

                    new Thread(() -> {
                        try {
                            Thread.sleep(30000); 
                            if (isRedisConnectionAvailable()) {
                                connectToKis();
                            } else {
                                log.warn("⚠️ Redis 연결이 여전히 불안정합니다. 재연결을 포기합니다.");
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        } catch (Exception e) {
                            log.error("❌ 지연된 KIS WebSocket 재연결 실패", e);
                        }
                    }).start();
                }
            }
        }

        private void subscribeToDefaultStocks(WebSocketSession session, List<String> stockCodes) {
            for (String stockCode : stockCodes) {
                try {
                    JSONObject request = createKisSubscriptionRequest(stockCode);

                    synchronized (session) {
                        if (session.isOpen()) {
                            session.sendMessage(new TextMessage(request.toString()));
                            log.debug("✅ KIS 기본 구독 성공: {}", stockCode);
                        } else {
                            log.warn("⚠️ KIS WebSocket 세션이 닫혀있음 (기본 구독): {}", stockCode);
                            break;
                        }
                    }
                } catch (IllegalStateException e) {
                    log.warn("⚠️ KIS WebSocket 세션 상태 오류 (기본 구독): {}", stockCode, e.getMessage());
                    break;
                } catch (Exception e) {
                    log.error("❌ KIS 기본 구독 실패: {}", stockCode, e);

                    if (e.getMessage().contains("TEXT_PARTIAL_WRITING") || 
                        e.getMessage().contains("remote endpoint")) {
                        break;
                    }
                }
            }
        }

        private void handleKisRealtimeData(String message) {
            try {


                if (message.startsWith("0|H0STCNT0|")) {
                    String[] mainParts = message.split("\\|");
                    if (mainParts.length >= 4) {

                        String dataString = mainParts[3];
                        String[] dataParts = dataString.split("\\^");

                        if (dataParts.length >= 15) {
                            String stockCode = dataParts[0].trim(); 

                            String currentPrice = dataParts[2].trim(); 
                            String changeSign = dataParts[3].trim(); 
                            String changePrice = dataParts[4].trim(); 
                            String changeRate = dataParts[5].trim(); 
                            

                            String calculatedChangeRate = "0";
                            try {
                                    double currentPriceValue = Double.parseDouble(currentPrice);
                                    double changePriceValue = Double.parseDouble(changePrice);
                                    
                                    if (currentPriceValue > 0 && changePriceValue != 0) {
                                            double changeRateValue = (changePriceValue / (currentPriceValue - changePriceValue)) * 100;
                                            calculatedChangeRate = String.format("%.2f", changeRateValue);
                                    }
                            } catch (Exception e) {
                                    log.warn("WebSocket 등락률 계산 실패, KIS 값 사용: 종목={}, 에러={}", stockCode, e.getMessage());
                                    calculatedChangeRate = changeRate;
                            }
                            

                            log.info("📊 KIS 실시간 현재가 수신: 종목={}, 현재가={}, 전일대비={}, 계산된등락률={}, KIS등락률={}", 
                                stockCode, currentPrice, changePrice, calculatedChangeRate, changeRate);




                            String openPrice = dataParts[7].trim(); 
                            String highPrice = dataParts[8].trim(); 
                            String lowPrice = dataParts[9].trim(); 
                            String previousClose = dataParts[10].trim(); 
                            String bidPrice = dataParts[11].trim(); 
                            String askPrice = dataParts[12].trim(); 
                            String volume = dataParts[13].trim(); 



                            String normalizedChangeSign = normalizeChangeSign(changeSign);


                            String stockName = getStockNameFromCache(stockCode);


                            MarketTimeUtils.MarketTimeInfo marketInfo = marketTimeUtils.getMarketTimeInfo();
                            boolean isMarketOpen = marketInfo.isMarketOpen();
                            boolean isAfterMarketClose = marketInfo.isMarketClosed() &&
                                    !marketInfo.getMarketStatus().equals(MarketTimeUtils.MarketStatus.CLOSED_WEEKEND) &&
                                    !marketInfo.getMarketStatus().equals(MarketTimeUtils.MarketStatus.CLOSED_HOLIDAY);


                            String displayCurrentPrice = currentPrice;
                            if (isAfterMarketClose) {

                            }


                            List<OrderBookItem> askOrders = new ArrayList<>();
                            List<OrderBookItem> bidOrders = new ArrayList<>();
                            String totalAskQuantity = "0";
                            String totalBidQuantity = "0";
                            
                            try {

                                OrderBookResponse orderBookResponse = stockService.getOrderBook(stockCode);
                                askOrders = orderBookResponse.getAskOrders();
                                bidOrders = orderBookResponse.getBidOrders();
                                totalAskQuantity = orderBookResponse.getTotalAskQuantity();
                                totalBidQuantity = orderBookResponse.getTotalBidQuantity();
                                

                                

                                long currentPriceLong = Long.parseLong(currentPrice);
                                boolean hasValidAskOrders = askOrders.stream()
                                    .anyMatch(ask -> Long.parseLong(ask.getPrice()) > currentPriceLong);
                                boolean hasValidBidOrders = bidOrders.stream()
                                    .anyMatch(bid -> Long.parseLong(bid.getPrice()) < currentPriceLong);
                                

                                if (!hasValidAskOrders || !hasValidBidOrders) {

                                    askOrders = generateOrderBookAroundCurrentPrice(currentPrice, true);
                                    bidOrders = generateOrderBookAroundCurrentPrice(currentPrice, false);
                                    

                                    totalAskQuantity = String.valueOf(askOrders.stream()
                                        .mapToLong(order -> Long.parseLong(order.getQuantity())).sum());
                                    totalBidQuantity = String.valueOf(bidOrders.stream()
                                        .mapToLong(order -> Long.parseLong(order.getQuantity())).sum());
                                }
                                

                                if (isRedisConnectionAvailable()) {
                                    try {
                                        String orderBookCacheKey = "orderbook:" + stockCode;
                                        OrderBookResponse adjustedResponse = OrderBookResponse.builder()
                                            .stockCode(stockCode)
                                            .stockName(stockName)
                                            .currentPrice(currentPrice)
                                            .askOrders(askOrders)
                                            .bidOrders(bidOrders)
                                            .totalAskQuantity(totalAskQuantity)
                                            .totalBidQuantity(totalBidQuantity)
                                            .build();
                                        redisTemplate.opsForValue().set(orderBookCacheKey, objectMapper.writeValueAsString(adjustedResponse), Duration.ofSeconds(1));
                                    } catch (Exception e) {
                                        log.debug("Redis 호가창 캐시 저장 실패 (무시): {}", stockCode);
                                    }
                                }
                                

                            } catch (Exception e) {
                                log.debug("⚠️ 실시간 호가창 데이터 조회 실패: {} - {}", stockCode, e.getMessage());

                                askOrders = generateOrderBookAroundCurrentPrice(currentPrice, true);
                                bidOrders = generateOrderBookAroundCurrentPrice(currentPrice, false);
                                totalAskQuantity = String.valueOf(askOrders.stream()
                                    .mapToLong(order -> Long.parseLong(order.getQuantity())).sum());
                                totalBidQuantity = String.valueOf(bidOrders.stream()
                                    .mapToLong(order -> Long.parseLong(order.getQuantity())).sum());
                            }
                            

                            try {
                                OrderMatchingEvent event = new OrderMatchingEvent(this, stockCode, displayCurrentPrice, askOrders, bidOrders);
                                eventPublisher.publishEvent(event);
                            } catch (Exception e) {
                                log.error("❌ 주문 매칭 이벤트 발행 실패: {}", stockCode, e);
                            }


                            StockPriceResponse stockData = StockPriceResponse.builder()
                                    .stockCode(stockCode)
                                    .stockName(stockName)
                                    .currentPrice(displayCurrentPrice)
                                    .changePrice(changePrice)
                                    .changeRate(calculatedChangeRate)
                                    .changeSign(normalizedChangeSign)
                                    .volume(volume)
                                    .openPrice(openPrice)
                                    .highPrice(highPrice)
                                    .lowPrice(lowPrice)
                                    .previousClose(previousClose)
                                    .marketCap(calculateMarketCap(stockCode, currentPrice))
                                    .updatedTime(String.valueOf(System.currentTimeMillis()))

                                    .isMarketOpen(isMarketOpen)
                                    .isAfterMarketClose(isAfterMarketClose)
                                    .marketStatus(marketInfo.getStatusMessage())

                                    .askOrders(askOrders)
                                    .bidOrders(bidOrders)
                                    .totalAskQuantity(totalAskQuantity)
                                    .totalBidQuantity(totalBidQuantity)
                                    .build();
                            

                            stockData.calculateSpread();
                            stockData.calculateImbalanceRatio();


                            if (isRedisConnectionAvailable()) {
                                try {
                                    String key = "stock:realtime:" + stockCode;
                                    String stockDataJson = objectMapper.writeValueAsString(stockData);
                                    
                                    log.info("💾 Redis 캐시 저장: 종목={}, 현재가={}, 키={}", 
                                        stockCode, displayCurrentPrice, key);
                                    
                                    redisTemplate.opsForValue().set(key, stockDataJson);
                                    

                                    String savedData = (String) redisTemplate.opsForValue().get(key);
                                    if (savedData != null) {
                                        log.info("✅ Redis 저장 확인: 종목={}, 저장된데이터길이={}", 
                                            stockCode, savedData.length());
                                    } else {
                                        log.warn("⚠️ Redis 저장 실패: 종목={}", stockCode);
                                    }


                                    if (isAfterMarketClose) {
                                        String closingPriceKey = "stock:closing:" + stockCode;
                                        redisTemplate.opsForValue().set(closingPriceKey, stockDataJson);
                                        log.info("장종료 종가 데이터 저장: 종목={}, 종가={}", stockCode, currentPrice);
                                    }
                                } catch (Exception e) {
                                    log.error("❌ Redis 실시간 데이터 캐시 저장 실패: 종목={}, 에러={}", stockCode, e.getMessage());
                                }
                            } else {
                                log.warn("⚠️ Redis 연결 불가 - 캐시 저장 건너뜀: 종목={}", stockCode);
                            }


                            

                            Set<WebSocketSession> subscribers = stockSubscriptions.get(stockCode);
                            int subscriberCount = subscribers != null ? subscribers.size() : 0;
                            log.info("📡 현재가 브로드캐스트 시작: 종목={}, 현재가={}, 구독자수={}", 
                                stockCode, displayCurrentPrice, subscriberCount);
                            broadcastToSubscribers(stockCode, stockData);


                            try {
                                kafkaStockService.sendRealTimeStockData(
                                    stockCode,
                                    stockName,
                                    displayCurrentPrice,
                                    changePrice,
                                    calculatedChangeRate,
                                    normalizedChangeSign
                                );
                                log.debug("📤 Kafka 실시간 데이터 전송: {} - {}", stockCode, displayCurrentPrice);
                            } catch (Exception e) {
                                log.debug("⚠️ Kafka 데이터 전송 실패 (무시): {}", stockCode);
                            }


                            try {
                                stockChartService.updateCurrentCandle(stockCode, currentPrice, volume);
                            } catch (Exception e) {
                                log.debug("Redis 캔들 업데이트 실패 (무시): 종목={}", stockCode);
                            }


                            if (isRedisConnectionAvailable()) {
                                try {
                                    String volumeCacheKey = "cumulative_volume:" + stockCode + ":" + System.currentTimeMillis();
                                    redisTemplate.opsForValue().set(volumeCacheKey, volume, Duration.ofMinutes(5));
                                } catch (Exception e) {
                                    log.debug("Redis 거래량 캐시 저장 실패 (무시): {}", stockCode);
                                }
                            }
                            

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


                        } else {
                            log.warn("⚠️ KIS 데이터 필드 부족: 예상 15개, 실제 {}개", dataParts.length);
                        }
                    } else {
                        log.warn("⚠️ KIS 데이터 형식 오류: mainParts.length = {}", mainParts.length);
                    }
                } else {

                }
            } catch (Exception e) {
                log.error("❌ KIS 실시간 데이터 처리 실패: {}", message, e);
            }
        }

        private String normalizeChangeSign(String kisChangeSign) {

            switch (kisChangeSign) {
                case "2":
                    return "2"; 
                case "5":
                    return "4"; 
                case "3":
                    return "3"; 
                case "1":
                    return "1"; 
                case "4":
                    return "5"; 
                default:
                    return "3"; 
            }
        }

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

        private List<OrderBookItem> generateOrderBookAroundCurrentPrice(String currentPrice, boolean isAsk) {
            List<OrderBookItem> orders = new ArrayList<>();
            long basePrice = Long.parseLong(currentPrice);
            Random random = new Random();
            
            for (int i = 1; i <= 10; i++) {
                long price;
                if (isAsk) {
                    price = basePrice + (i * 50); 
                } else {
                    price = basePrice - (i * 50); 
                }
                

                int baseQuantity = 500 - (i * 30);
                long quantity = Math.max(baseQuantity + random.nextInt(200), 50);
                
                orders.add(OrderBookItem.builder()
                    .price(String.valueOf(price))
                    .quantity(String.valueOf(quantity))
                    .orderCount(String.valueOf(i))
                    .orderType(isAsk ? "매도" : "매수")
                    .rank(i)
                    .build());
            }
            
            return orders;
        }

        private String getStockNameFromCache(String stockCode) {
            try {

                if (isRedisConnectionAvailable()) {
                    String cachedName = (String) redisTemplate.opsForValue().get("stock:name:" + stockCode);
                    if (cachedName != null) {
                        return cachedName;
                    }
                } else {
                    log.debug("Redis 연결 불가 - 캐시 조회 건너뛰기: {}", stockCode);
                }


                try {
                    Stock stock = stockRepository.findBySymbol(stockCode).orElse(null);
                    if (stock != null && stock.getName() != null) {

                        if (isRedisConnectionAvailable()) {
                            try {
                                redisTemplate.opsForValue().set("stock:name:" + stockCode, stock.getName(), Duration.ofHours(24));
                            } catch (Exception e) {
                                log.debug("Redis 캐시 저장 실패 (무시): {}", stockCode);
                            }
                        }
                        return stock.getName();
                    }
                } catch (Exception e) {
                    log.warn("⚠️ DB에서 종목명 조회 실패: {}", stockCode, e);
                }


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
                    case "000810":
                        return "삼성화재";
                    case "034020":
                        return "쿠팡";
                    case "042660":
                        return "대웅제약";
                    case "086790":
                        return "하나금융지주";
                    default:
                        return stockCode; 
                }
            } catch (Exception e) {
                log.warn("⚠️ 종목명 조회 실패: {}", stockCode, e);
                return stockCode;
            }
        }

        private String calculateMarketCap(String stockCode, String currentPrice) {
            try {

                long shares = getListedShares(stockCode);
                long price = Long.parseLong(currentPrice);
                long marketCap = (shares * price) / 100000000; 
                return String.valueOf(marketCap);
            } catch (Exception e) {
                log.warn("⚠️ 시가총액 계산 실패: {}", stockCode, e);
                return "0";
            }
        }

        private long getListedShares(String stockCode) {

            switch (stockCode) {
                case "005930":
                    return 5969782550L; 
                case "000660":
                    return 731883151L; 
                case "035420":
                    return 16570000L; 
                case "035720":
                    return 434265829L; 
                case "005380":
                    return 3284956600L; 
                case "051910":
                    return 365206200L; 
                case "207940":
                    return 119548400L; 
                case "068270":
                    return 865306600L; 
                case "323410":
                    return 2627039200L; 
                case "373220":
                    return 685074950L; 
                default:
                    return 100000000L; 
            }
        }

    }

    @FunctionalInterface
    private interface RedisOperation<T> {
        T execute();
    }



    private <T> T executeRedisSafely(RedisOperation<T> operation, T defaultValue) {
        try {
            if (!isRedisConnectionAvailable()) {

                log.debug("Redis 연결이 사용 불가능합니다. 기본값을 사용합니다.");
                return defaultValue;
            }
            return operation.execute();
        } catch (Exception e) {

            log.debug("Redis 작업 실패: {}", e.getMessage());
            return defaultValue;
        }
    }

    @Scheduled(cron = "0 * * * * *") 
    public void checkMarketCloseAndSaveClosingPrices() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalTime currentTime = now.toLocalTime();
            

            if (currentTime.getHour() == 15 && currentTime.getMinute() == 30 && !marketClosedToday) {
                log.info("🕐 장종료 시점 감지 - 종가 데이터 저장 시작");
                marketClosedToday = true;
                

                for (String stockCode : stockSubscriptions.keySet()) {
                    try {
                        String realtimeData = (String) redisTemplate.opsForValue().get("stock:realtime:" + stockCode);
                        if (realtimeData != null) {
                            String closingPriceKey = "stock:closing:" + stockCode;
                            redisTemplate.opsForValue().set(closingPriceKey, realtimeData);
                            log.info("장종료 종가 데이터 저장 완료: 종목={}", stockCode);
                        }
                    } catch (Exception e) {
                        log.error("장종료 종가 데이터 저장 실패: 종목={}", stockCode, e);
                    }
                }
                
                log.info("✅ 장종료 종가 데이터 저장 완료");
            }
            

            if (currentTime.getHour() == 9 && currentTime.getMinute() == 0) {
                marketClosedToday = false;
                log.info("🔄 장종료 플래그 리셋 - 새로운 거래일 시작");
            }
            
        } catch (Exception e) {
            log.error("❌ 장종료 감지 스케줄러 오류", e);
        }
    }

    public void sendOrderExecutionNotification(UUID memberId, Long orderId, String message) {
        try {

            String notificationMessage = String.format(
                "{\"type\":\"ORDER_EXECUTION\",\"orderId\":%d,\"message\":\"%s\",\"timestamp\":%d}",
                orderId, message, System.currentTimeMillis()
            );
            

            broadcastToAllClients(notificationMessage);
            
        } catch (Exception e) {
            log.error("❌ 주문 체결 알림 전송 실패: memberId={}, orderId={}", memberId, orderId, e);
        }
    }

    private void broadcastToAllClients(String message) {
        for (WebSocketSession session : clientSessions) {
            try {
                if (session.isOpen()) {
                    synchronized (session) {
                        if (session.isOpen()) {
                            session.sendMessage(new TextMessage(message));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("⚠️ 브로드캐스트 전송 실패: {}", session.getId(), e);
            }
        }
    }
}