package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.StockResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
}