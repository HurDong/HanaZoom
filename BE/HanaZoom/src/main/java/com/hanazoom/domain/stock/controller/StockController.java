package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.dto.StockSearchResult;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.domain.stock.service.StockSearchService;
import com.hanazoom.domain.stock.service.StockSyncService;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final StockSearchService stockSearchService;
    private final StockSyncService stockSyncService;

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

    /**
     * Elasticsearch 기반 주식 검색 (오타 허용 + 형태소 분석)
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<StockSearchResult>>> searchStocks(@RequestParam String query) {
        try {
            log.info("🔍 주식 검색 요청: {}", query);
            List<StockSearchResult> results = stockSearchService.searchStocks(query);

            // 검색 결과가 없으면 fallback으로 MySQL 검색
            if (results.isEmpty()) {
                log.info("⚠️ Elasticsearch 결과 없음, MySQL fallback 사용");
                List<StockTickerDto> mysqlResults = stockService.searchStocks(query);

                // StockTickerDto를 StockSearchResult로 변환
                results = mysqlResults.stream()
                        .map(this::convertToSearchResult)
                        .collect(java.util.stream.Collectors.toList());
            }

            return ResponseEntity.ok(ApiResponse.success(results));
        } catch (Exception e) {
            log.error("❌ 주식 검색 실패", e);
            // 에러 시 MySQL fallback
            List<StockTickerDto> fallbackResults = stockService.searchStocks(query);
            List<StockSearchResult> results = fallbackResults.stream()
                    .map(this::convertToSearchResult)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(results));
        }
    }

    /**
     * 자동완성 제안
     */
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

    /**
     * 섹터별 검색
     */
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

    /**
     * Elasticsearch 수동 동기화 (관리자용)
     */
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

    /**
     * StockTickerDto를 StockSearchResult로 변환
     */
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
}