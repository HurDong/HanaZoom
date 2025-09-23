package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.domain.stock.service.KafkaStockConsumer;
import com.hanazoom.domain.stock.service.KafkaStockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final KafkaStockConsumer kafkaStockConsumer;
    private final KafkaStockService kafkaStockService;

    @GetMapping("/{symbol}")
    public ResponseEntity<ApiResponse<StockResponse>> getStock(@PathVariable String symbol) {
        try {
            Stock stock = stockService.getStockBySymbol(symbol);
            return ResponseEntity.ok(ApiResponse.success(StockResponse.from(stock)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/ticker")
    public ResponseEntity<ApiResponse<List<StockTickerDto>>> getStockTickers() {
        List<StockTickerDto> tickers = stockService.getStockTickers();
        return ResponseEntity.ok(ApiResponse.success(tickers));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<StockTickerDto>>> searchStocks(@RequestParam String query) {
        List<StockTickerDto> stocks = stockService.searchStocks(query);
        return ResponseEntity.ok(ApiResponse.success(stocks));
    }

    /**
     * 모든 주식 종목을 페이지네이션으로 조회
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<StockTickerDto>>> getAllStocks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "symbol") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        try {
            log.info("getAllStocks API 호출 - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);

            // 디버깅: 데이터베이스 상태 확인
            if (stockService instanceof com.hanazoom.domain.stock.service.StockServiceImpl) {
                ((com.hanazoom.domain.stock.service.StockServiceImpl) stockService).debugDatabaseStatus();
            }

            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            log.info("생성된 pageable: {}", pageable);

            Page<StockTickerDto> stocks = stockService.getAllStocks(pageable);
            log.info("성공적으로 주식 데이터 조회 완료 - totalElements: {}", stocks.getTotalElements());

            return ResponseEntity.ok(ApiResponse.success(stocks));

        } catch (Exception e) {
            log.error("getAllStocks API 실행 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("주식 목록 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * KIS API를 통한 실시간 주식 현재가 조회
     * 
     * @param stockCode 종목코드 (6자리, 예: 005930)
     */
    @GetMapping("/realtime/{stockCode}")
    public ResponseEntity<ApiResponse<StockPriceResponse>> getRealTimePrice(@PathVariable String stockCode) {
        log.info("Real-time price request for stock code: {}", stockCode);

        try {
            // 종목코드 유효성 검사
            if (stockCode == null || stockCode.length() != 6 || !stockCode.matches("\\d+")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("유효하지 않은 종목코드입니다. 6자리 숫자로 입력해주세요."));
            }

            StockPriceResponse priceInfo = stockService.getRealTimePrice(stockCode);
            return ResponseEntity.ok(ApiResponse.success(priceInfo));

        } catch (RuntimeException e) {
            log.error("Failed to fetch real-time price for stock code: {}", stockCode, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("실시간 가격 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * KIS API를 통한 종목 기본정보 조회
     * 
     * @param stockCode 종목코드 (6자리, 예: 005930)
     */
    @GetMapping("/info/{stockCode}")
    public ResponseEntity<ApiResponse<StockBasicInfoResponse>> getStockBasicInfo(@PathVariable String stockCode) {
        log.info("Stock basic info request for stock code: {}", stockCode);

        try {
            // 종목코드 유효성 검사
            if (stockCode == null || stockCode.length() != 6 || !stockCode.matches("\\d+")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("유효하지 않은 종목코드입니다. 6자리 숫자로 입력해주세요."));
            }

            StockBasicInfoResponse basicInfo = stockService.getStockBasicInfo(stockCode);
            return ResponseEntity.ok(ApiResponse.success(basicInfo));

        } catch (RuntimeException e) {
            log.error("Failed to fetch basic info for stock code: {}", stockCode, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("종목 기본정보 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * KIS API를 통한 호가창 정보 조회
     * 
     * @param stockCode 종목코드 (6자리, 예: 005930)
     */
    @GetMapping("/orderbook/{stockCode}")
    public ResponseEntity<ApiResponse<OrderBookResponse>> getOrderBook(@PathVariable String stockCode) {
        log.info("Order book request for stock code: {}", stockCode);

        try {
            // 종목코드 유효성 검사
            if (stockCode == null || stockCode.length() != 6 || !stockCode.matches("\\d+")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("유효하지 않은 종목코드입니다. 6자리 숫자로 입력해주세요."));
            }

            OrderBookResponse orderBook = stockService.getOrderBook(stockCode);
            return ResponseEntity.ok(ApiResponse.success(orderBook));

        } catch (RuntimeException e) {
            log.error("Failed to fetch order book for stock code: {}", stockCode, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("호가창 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // ===== Kafka 기반 실시간 데이터 API =====

    /**
     * Kafka에서 실시간 주식 데이터 조회 (WebSocket 대신)
     */
    @GetMapping("/kafka/realtime/{stockCode}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKafkaRealTimeData(@PathVariable String stockCode) {
        log.info("Kafka 실시간 데이터 요청: {}", stockCode);

        try {
            Map<String, Object> stockData = kafkaStockConsumer.getRealTimeStockData(stockCode);

            if (stockData != null) {
                return ResponseEntity.ok(ApiResponse.success(stockData));
            } else {
                return ResponseEntity.ok()
                        .body(ApiResponse.success(Map.of(
                            "stockCode", stockCode,
                            "message", "실시간 데이터가 아직 준비되지 않았습니다.",
                            "timestamp", java.time.LocalDateTime.now()
                        )));
            }

        } catch (Exception e) {
            log.error("Kafka 실시간 데이터 조회 실패: {}", stockCode, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("실시간 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    /**
     * 모든 Kafka 실시간 데이터 조회
     */
    @GetMapping("/kafka/realtime/all")
    public ResponseEntity<ApiResponse<Map<String, Map<String, Object>>>> getAllKafkaRealTimeData() {
        log.info("모든 Kafka 실시간 데이터 요청");

        try {
            Map<String, Map<String, Object>> allData = kafkaStockConsumer.getAllRealTimeStockData();
            return ResponseEntity.ok(ApiResponse.success(allData));

        } catch (Exception e) {
            log.error("Kafka 전체 실시간 데이터 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("전체 실시간 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    /**
     * Kafka Consumer 상태 조회
     */
    @GetMapping("/kafka/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKafkaConsumerStatus() {
        log.info("Kafka Consumer 상태 조회");

        try {
            Map<String, Object> status = kafkaStockConsumer.getConsumerStatus();
            return ResponseEntity.ok(ApiResponse.success(status));

        } catch (Exception e) {
            log.error("Kafka Consumer 상태 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Consumer 상태 조회 중 오류가 발생했습니다."));
        }
    }

    /**
     * Kafka 성능 비교 테스트
     */
    @PostMapping("/kafka/test-comparison")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testComparison() {
        log.info("Kafka vs WebSocket 성능 비교 테스트 시작");

        try {
            Map<String, Object> result = new java.util.HashMap<>();

            // Kafka 테스트
            long kafkaStartTime = System.currentTimeMillis();
            Map<String, Map<String, Object>> kafkaData = kafkaStockConsumer.getAllRealTimeStockData();
            long kafkaEndTime = System.currentTimeMillis();

            // WebSocket 시뮬레이션 (실제 WebSocket 서비스 호출)
            long websocketStartTime = System.currentTimeMillis();
            // 실제로는 WebSocket 서비스 호출
            // List<StockTickerDto> websocketData = stockService.getStockTickers();
            long websocketEndTime = System.currentTimeMillis();

            result.put("kafkaDataCount", kafkaData.size());
            result.put("kafkaResponseTime", kafkaEndTime - kafkaStartTime);
            result.put("websocketResponseTime", websocketEndTime - websocketStartTime);
            result.put("kafkaCachedStocks", kafkaStockConsumer.getCachedStockCount());
            result.put("timestamp", java.time.LocalDateTime.now());

            // 성능 메트릭 전송
            kafkaStockService.sendComparisonMetrics(
                "kafka",
                "getAllData",
                kafkaStartTime,
                kafkaEndTime
            );

            log.info("성능 비교 테스트 완료 - Kafka: {}ms, WebSocket: {}ms",
                    kafkaEndTime - kafkaStartTime, websocketEndTime - websocketStartTime);

            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            log.error("성능 비교 테스트 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("성능 비교 테스트 중 오류가 발생했습니다."));
        }
    }
}