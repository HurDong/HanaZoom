package com.hanazoom.domain.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;

import java.util.Map;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(value = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaStockConsumer {

    @PostConstruct
    public void init() {
        log.info("🎯 Kafka Consumer 초기화 시작 - WebSocket과 완전히 분리됨");

        new Thread(() -> {
            try {

                Thread.sleep(2000); 
                log.info("✅ Kafka Consumer 초기화 완료 - WebSocket과 독립적 동작");
            } catch (Exception e) {
                log.warn("⚠️ Kafka 초기화 중 오류 발생 (WebSocket에는 영향 없음): {}", e.getMessage());
            }
        }).start();
    }

    private final ObjectMapper objectMapper;
    private final KafkaStockService kafkaStockService;


    private final Map<String, Map<String, Object>> realTimeStockCache = new ConcurrentHashMap<>();


    private final AtomicLong totalMessagesProcessed = new AtomicLong(0);
    private final AtomicLong totalProcessingTime = new AtomicLong(0);
    private final AtomicInteger activeConnections = new AtomicInteger(0);


    private static final String STOCK_REALTIME_TOPIC = "stock-realtime-data";
    private static final String PERFORMANCE_METRICS_TOPIC = "performance-metrics";

    @KafkaListener(topics = STOCK_REALTIME_TOPIC, groupId = "wts-consumer-group")
    public void consumeRealTimeStockData(
            @Payload String message,
            @Header("kafka_receivedTopic") String topic,
            @Header("kafka_receivedPartitionId") String partition,
            @Header("kafka_receivedTimestamp") String timestamp
    ) {
        long startTime = System.currentTimeMillis();

        try {
            JsonNode jsonNode = objectMapper.readTree(message);

            String stockCode = jsonNode.get("stockCode").asText();
            String stockName = jsonNode.get("stockName").asText();
            String currentPrice = jsonNode.get("currentPrice").asText();
            String changePrice = jsonNode.get("changePrice").asText();
            String changeRate = jsonNode.get("changeRate").asText();
            String changeSign = jsonNode.get("changeSign").asText();


            Map<String, Object> stockData = Map.of(
                "stockCode", stockCode,
                "stockName", stockName,
                "currentPrice", currentPrice,
                "changePrice", changePrice,
                "changeRate", changeRate,
                "changeSign", changeSign,
                "timestamp", LocalDateTime.now()
            );

            realTimeStockCache.put(stockCode, stockData);


            long processingTime = System.currentTimeMillis() - startTime;
            totalMessagesProcessed.incrementAndGet();
            totalProcessingTime.addAndGet(processingTime);

            log.debug("📈 Kafka 수신 - 실시간 데이터: {} - {} (처리시간: {}ms)",
                     stockCode, currentPrice, processingTime);


            if (totalMessagesProcessed.get() % 10 == 0) {
                sendPerformanceMetrics();
            }

        } catch (Exception e) {
            log.error("❌ Kafka 메시지 처리 실패: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "stock-batch-data", groupId = "wts-consumer-group")
    public void consumeBatchStockData(
            @Payload String message,
            @Header("kafka_receivedTopic") String topic
    ) {
        long startTime = System.currentTimeMillis();

        try {
            JsonNode jsonNode = objectMapper.readTree(message);

            String batchId = jsonNode.get("batchId").asText();
            String type = jsonNode.get("type").asText();

            log.info("📦 Kafka 수신 - 배치 데이터: {} (타입: {})", batchId, type);




            long processingTime = System.currentTimeMillis() - startTime;
            log.debug("✅ 배치 처리 완료: {} (처리시간: {}ms)", batchId, processingTime);

        } catch (Exception e) {
            log.error("❌ 배치 데이터 처리 실패: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = PERFORMANCE_METRICS_TOPIC, groupId = "wts-consumer-group")
    public void consumePerformanceMetrics(
            @Payload String message,
            @Header("kafka_receivedTopic") String topic
    ) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);

            String metricType = jsonNode.get("metricType").asText();
            String service = jsonNode.get("service").asText();

            log.info("📊 Kafka 수신 - 성능 메트릭: {} from {}", metricType, service);

        } catch (Exception e) {
            log.error("❌ 성능 메트릭 처리 실패: {}", e.getMessage(), e);
        }
    }

    public Map<String, Object> getRealTimeStockData(String stockCode) {
        return realTimeStockCache.get(stockCode);
    }

    public Map<String, Map<String, Object>> getAllRealTimeStockData() {
        return new ConcurrentHashMap<>(realTimeStockCache);
    }

    public int getCachedStockCount() {
        return realTimeStockCache.size();
    }

    private void sendPerformanceMetrics() {
        try {
            long avgProcessingTime = totalMessagesProcessed.get() > 0
                ? totalProcessingTime.get() / totalMessagesProcessed.get()
                : 0;

            kafkaStockService.sendWTSPerformanceMetrics(
                activeConnections.get(),
                realTimeStockCache.size(),
                avgProcessingTime,
                0.0, 
                Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()
            );

        } catch (Exception e) {
            log.error("❌ 성능 메트릭 전송 실패: {}", e.getMessage(), e);
        }
    }

    public void incrementActiveConnections() {
        activeConnections.incrementAndGet();
    }

    public void decrementActiveConnections() {
        activeConnections.decrementAndGet();
    }

    public Map<String, Object> getConsumerStatus() {
        long avgProcessingTime = totalMessagesProcessed.get() > 0
            ? totalProcessingTime.get() / totalMessagesProcessed.get()
            : 0;

        return Map.of(
            "totalMessagesProcessed", totalMessagesProcessed.get(),
            "avgProcessingTime", avgProcessingTime,
            "cachedStocks", realTimeStockCache.size(),
            "activeConnections", activeConnections.get(),
            "timestamp", LocalDateTime.now()
        );
    }
}
