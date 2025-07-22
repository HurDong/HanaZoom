package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping("/ticker")
    public ResponseEntity<ApiResponse<List<StockTickerDto>>> getStockTicker() {
        List<StockTickerDto> stockTickerData = stockService.getStockTickerData();
        return ResponseEntity.ok(new ApiResponse<>(stockTickerData));
    }
}