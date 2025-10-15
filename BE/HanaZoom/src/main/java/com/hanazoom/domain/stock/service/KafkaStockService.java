package com.hanazoom.domain.stock.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(value = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaStockService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;


    private static final String STOCK_REALTIME_TOPIC = "stock-realtime-data";
    private static final String STOCK_BATCH_TOPIC = "stock-batch-data";
    private static final String PERFORMANCE_METRICS_TOPIC = "performance-metrics";

    public CompletableFuture<SendResult<String, String>> sendRealTimeStockData(
            String stockCode,
            String stockName,
            String currentPrice,
            String changePrice,
            String changeRate,
            String changeSign
    ) {
        Map<String, Object> stockData = new HashMap<>();
        stockData.put("stockCode", stockCode);
        stockData.put("stockName", stockName);
        stockData.put("currentPrice", currentPrice);
        stockData.put("changePrice", changePrice);
        stockData.put("changeRate", changeRate);
        stockData.put("changeSign", changeSign);
        stockData.put("timestamp", LocalDateTime.now());

        try {
            String message = objectMapper.writeValueAsString(stockData);
            log.info("📈 Kafka 전송 - 실시간 주식 데이터: {} - {}", stockCode, currentPrice);

            return kafkaTemplate.send(STOCK_REALTIME_TOPIC, stockCode, message);
        } catch (JsonProcessingException e) {
            log.error("❌ JSON 변환 실패", e);
            throw new RuntimeException("JSON 변환 실패", e);
        }
    }

    public CompletableFuture<SendResult<String, String>> sendBatchStockData(
            String batchId,
            Map<String, Object> stockBatch
    ) {
        stockBatch.put("batchId", batchId);
        stockBatch.put("timestamp", LocalDateTime.now());
        stockBatch.put("type", "batch");

        try {
            String message = objectMapper.writeValueAsString(stockBatch);
            log.info("📦 Kafka 전송 - 배치 주식 데이터: {}", batchId);

            return kafkaTemplate.send(STOCK_BATCH_TOPIC, batchId, message);
        } catch (JsonProcessingException e) {
            log.error("❌ 배치 JSON 변환 실패", e);
            throw new RuntimeException("배치 JSON 변환 실패", e);
        }
    }

    public CompletableFuture<SendResult<String, String>> sendPerformanceMetrics(
            String metricType,
            Map<String, Object> metrics
    ) {
        metrics.put("metricType", metricType);
        metrics.put("timestamp", LocalDateTime.now());
        metrics.put("service", "wts-stock-service");

        try {
            String message = objectMapper.writeValueAsString(metrics);
            log.debug("📊 Kafka 전송 - 성능 메트릭: {}", metricType);

            return kafkaTemplate.send(PERFORMANCE_METRICS_TOPIC, metricType, message);
        } catch (JsonProcessingException e) {
            log.error("❌ 메트릭 JSON 변환 실패", e);
            throw new RuntimeException("메트릭 JSON 변환 실패", e);
        }
    }

    public CompletableFuture<SendResult<String, String>> sendWTSPerformanceMetrics(
            int activeUsers,
            int totalStocks,
            long avgResponseTime,
            double cpuUsage,
            long memoryUsage
    ) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("activeUsers", activeUsers);
        metrics.put("totalStocks", totalStocks);
        metrics.put("avgResponseTime", avgResponseTime);
        metrics.put("cpuUsage", cpuUsage);
        metrics.put("memoryUsage", memoryUsage);

        return sendPerformanceMetrics("wts-page-performance", metrics);
    }

    public CompletableFuture<SendResult<String, String>> sendComparisonMetrics(
            String method,
            String operation,
            long startTime,
            long endTime
    ) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("method", method); 
        metrics.put("operation", operation); 
        metrics.put("duration", endTime - startTime);
        metrics.put("timestamp", LocalDateTime.now());

        return sendPerformanceMetrics("websocket-vs-kafka-comparison", metrics);
    }
}
