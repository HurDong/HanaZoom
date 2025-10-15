package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.CandleData;
import com.hanazoom.domain.stock.service.StockChartService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/stocks/chart")
@RequiredArgsConstructor
public class StockChartController {

    private final StockChartService stockChartService;

    @GetMapping("/{stockCode}")
    public ResponseEntity<ApiResponse<List<CandleData>>> getChartData(
            @PathVariable String stockCode,
            @RequestParam(defaultValue = "1D") String timeframe,
            @RequestParam(defaultValue = "100") int limit) {
        
        try {

            if (limit > 5000) {
                limit = 5000;
            }
            
            log.info("차트 데이터 요청: 종목={}, 시간봉={}, 개수={}", stockCode, timeframe, limit);
            
            List<CandleData> chartData = stockChartService.getChartData(stockCode, timeframe, limit);
            
            return ResponseEntity.ok(ApiResponse.success(chartData, "차트 데이터 조회 성공"));
            
        } catch (Exception e) {
            log.error("차트 데이터 조회 실패: 종목={}", stockCode, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("차트 데이터 조회에 실패했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/{stockCode}/current")
    public ResponseEntity<ApiResponse<CandleData>> getCurrentCandle(
            @PathVariable String stockCode,
            @RequestParam(defaultValue = "1D") String timeframe) {
        
        try {
            CandleData currentCandle = stockChartService.getCurrentCandle(stockCode, timeframe);
            
            return ResponseEntity.ok(ApiResponse.success(currentCandle, "현재 캔들 조회 성공"));
            
        } catch (Exception e) {
            log.error("현재 캔들 조회 실패: 종목={}", stockCode, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("현재 캔들 조회에 실패했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/timeframes")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedTimeframes() {
        List<String> timeframes = List.of("1M", "5M", "15M", "1H", "1D", "1W", "1MO");
        return ResponseEntity.ok(ApiResponse.success(timeframes, "지원 시간봉 목록"));
    }
}
