package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.dto.StockSearchResult;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.domain.stock.service.KafkaStockConsumer;
import com.hanazoom.domain.stock.service.KafkaStockService;
import com.hanazoom.domain.stock.service.StockSearchService;
import com.hanazoom.domain.stock.service.StockSyncService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final StockSearchService stockSearchService;
    private final StockSyncService stockSyncService;

    @Autowired(required = false)
    private KafkaStockConsumer kafkaStockConsumer;

    @Autowired(required = false)
    private KafkaStockService kafkaStockService;

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
    public ResponseEntity<ApiResponse<List<StockSearchResult>>> searchStocks(@RequestParam String query) {
        try {
            log.info("🔍 주식 검색 요청: {}", query);
            List<StockSearchResult> results = stockSearchService.searchStocks(query);


            if (results.isEmpty()) {
                log.info("⚠️ Elasticsearch 결과 없음, MySQL fallback 사용");
                List<StockTickerDto> mysqlResults = stockService.searchStocks(query);


                results = mysqlResults.stream()
                        .map(this::convertToSearchResult)
                        .collect(java.util.stream.Collectors.toList());
            }

            return ResponseEntity.ok(ApiResponse.success(results));
        } catch (Exception e) {
            log.error("❌ 주식 검색 실패", e);

            List<StockTickerDto> fallbackResults = stockService.searchStocks(query);
            List<StockSearchResult> results = fallbackResults.stream()
                    .map(this::convertToSearchResult)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(results));
        }
    }

    @GetMapping("/suggest")
    public ResponseEntity<ApiResponse<List<String>>> suggestStocks(@RequestParam String prefix) {
        try {
            List<String> suggestions = stockSearchService.getSuggestions(prefix);
            return ResponseEntity.ok(ApiResponse.success(suggestions));
        } catch (Exception e) {
            log.error("❌ 자동완성 실패", e);
            return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
        }
    }

    @GetMapping("/search/sector")
    public ResponseEntity<ApiResponse<List<StockSearchResult>>> searchByKeywordAndSector(
            @RequestParam String keyword,
            @RequestParam String sector) {
        try {
            List<StockSearchResult> results = stockSearchService.searchByKeywordAndSector(keyword, sector);
            return ResponseEntity.ok(ApiResponse.success(results));
        } catch (Exception e) {
            log.error("❌ 섹터별 검색 실패", e);
            return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Void>> syncToElasticsearch() {
        try {
            stockSyncService.syncAllStocksToElasticsearch();
            return ResponseEntity.ok(ApiResponse.success("Elasticsearch 동기화 완료"));
        } catch (Exception e) {
            log.error("❌ 동기화 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("동기화 실패: " + e.getMessage()));
        }
    }

    private StockSearchResult convertToSearchResult(StockTickerDto dto) {
        StockSearchResult result = StockSearchResult.builder()
                .symbol(dto.getSymbol())
                .name(dto.getName())
                .sector(dto.getSector())
                .currentPrice(dto.getCurrentPrice())
                .priceChangePercent(dto.getChangeRate())
                .logoUrl(dto.getLogoUrl())
                .score(0.0f)
                .matchType("MYSQL_FALLBACK")
                .build();
        result.setCompatibilityFields();
        return result;
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<StockTickerDto>>> getAllStocks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "symbol") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        try {
            log.info("getAllStocks API 호출 - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);


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

    @GetMapping("/realtime/{stockCode}")
    public ResponseEntity<ApiResponse<StockPriceResponse>> getRealTimePrice(@PathVariable String stockCode) {
        log.info("Real-time price request for stock code: {}", stockCode);

        try {

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

    @GetMapping("/info/{stockCode}")
    public ResponseEntity<ApiResponse<StockBasicInfoResponse>> getStockBasicInfo(@PathVariable String stockCode) {
        log.info("Stock basic info request for stock code: {}", stockCode);

        try {

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

    @GetMapping("/orderbook/{stockCode}")
    public ResponseEntity<ApiResponse<OrderBookResponse>> getOrderBook(@PathVariable String stockCode) {
        log.info("Order book request for stock code: {}", stockCode);

        try {

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



    @GetMapping("/kafka/realtime/{stockCode}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKafkaRealTimeData(@PathVariable String stockCode) {
        log.info("Kafka 실시간 데이터 요청: {}", stockCode);

        try {

            if (kafkaStockConsumer == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("stockCode", stockCode);
                response.put("message", "Kafka가 비활성화되어 있습니다.");
                response.put("kafkaEnabled", false);
                response.put("timestamp", LocalDateTime.now().toString());
                return ResponseEntity.ok().body(ApiResponse.<Map<String, Object>>success(response));
            }

            Map<String, Object> stockData = kafkaStockConsumer.getRealTimeStockData(stockCode);

            if (stockData != null) {
                return ResponseEntity.ok(ApiResponse.success(stockData));
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("stockCode", stockCode);
                response.put("message", "실시간 데이터가 아직 준비되지 않았습니다.");
                response.put("timestamp", LocalDateTime.now().toString());
                return ResponseEntity.ok().body(ApiResponse.<Map<String, Object>>success(response));
            }

        } catch (Exception e) {
            log.error("Kafka 실시간 데이터 조회 실패: {}", stockCode, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("실시간 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/kafka/realtime/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllKafkaRealTimeData() {
        log.info("모든 Kafka 실시간 데이터 요청");

        try {

            if (kafkaStockConsumer == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Kafka가 비활성화되어 있습니다.");
                response.put("kafkaEnabled", false);
                response.put("timestamp", LocalDateTime.now().toString());
                return ResponseEntity.ok().body(ApiResponse.<Map<String, Object>>success(response));
            }

            Map<String, Map<String, Object>> allData = kafkaStockConsumer.getAllRealTimeStockData();
            Map<String, Object> response = new HashMap<>();
            response.put("data", allData);
            response.put("kafkaEnabled", true);
            response.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.ok().body(ApiResponse.success(response));

        } catch (Exception e) {
            log.error("Kafka 전체 실시간 데이터 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("전체 실시간 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/kafka/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKafkaConsumerStatus() {
        log.info("Kafka Consumer 상태 조회");

        try {

            if (kafkaStockConsumer == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Kafka가 비활성화되어 있습니다.");
                response.put("kafkaEnabled", false);
                response.put("timestamp", LocalDateTime.now().toString());
                return ResponseEntity.ok().body(ApiResponse.<Map<String, Object>>success(response));
            }

            Map<String, Object> status = kafkaStockConsumer.getConsumerStatus();
            return ResponseEntity.ok(ApiResponse.success(status));

        } catch (Exception e) {
            log.error("Kafka Consumer 상태 조회 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Consumer 상태 조회 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/kafka/test-comparison")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testComparison() {
        log.info("Kafka vs WebSocket 성능 비교 테스트 시작");

        try {
            Map<String, Object> result = new java.util.HashMap<>();


            if (kafkaStockConsumer == null || kafkaStockService == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Kafka가 비활성화되어 테스트를 진행할 수 없습니다.");
                response.put("kafkaEnabled", false);
                response.put("timestamp", LocalDateTime.now().toString());
                return ResponseEntity.ok().body(ApiResponse.<Map<String, Object>>success(response));
            }


            long kafkaStartTime = System.currentTimeMillis();
            Map<String, Map<String, Object>> kafkaData = kafkaStockConsumer.getAllRealTimeStockData();
            long kafkaEndTime = System.currentTimeMillis();


            long websocketStartTime = System.currentTimeMillis();


            long websocketEndTime = System.currentTimeMillis();

            result.put("kafkaDataCount", kafkaData.size());
            result.put("kafkaResponseTime", kafkaEndTime - kafkaStartTime);
            result.put("websocketResponseTime", websocketEndTime - websocketStartTime);
            result.put("kafkaCachedStocks", kafkaStockConsumer.getCachedStockCount());
            result.put("timestamp", java.time.LocalDateTime.now());


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