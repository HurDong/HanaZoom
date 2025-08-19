package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

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