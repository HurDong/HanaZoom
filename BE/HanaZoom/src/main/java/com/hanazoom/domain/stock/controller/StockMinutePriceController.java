package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.entity.StockMinutePrice;
import com.hanazoom.domain.stock.service.StockMinutePriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stock-minute-prices")
@RequiredArgsConstructor
public class StockMinutePriceController {

    private final StockMinutePriceService stockMinutePriceService;

    @GetMapping("/{stockSymbol}/{minuteInterval}")
    public ResponseEntity<List<StockMinutePrice>> getRecentMinutePrices(
            @PathVariable String stockSymbol,
            @PathVariable StockMinutePrice.MinuteInterval minuteInterval,
            @RequestParam(defaultValue = "100") int limit) {
        
        try {
            log.info("분봉 데이터 조회 요청: 종목={}, 간격={}, 제한={}", stockSymbol, minuteInterval, limit);
            
            List<StockMinutePrice> prices = stockMinutePriceService
                    .getRecentMinutePrices(stockSymbol, minuteInterval, limit);
            
            log.info("분봉 데이터 조회 완료: 종목={}, 간격={}, 개수={}", stockSymbol, minuteInterval, prices.size());
            
            return ResponseEntity.ok(prices);
        } catch (Exception e) {
            log.error("분봉 데이터 조회 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{stockSymbol}/{minuteInterval}/range")
    public ResponseEntity<List<StockMinutePrice>> getMinutePricesByTimeRange(
            @PathVariable String stockSymbol,
            @PathVariable StockMinutePrice.MinuteInterval minuteInterval,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        try {
            log.info("분봉 데이터 범위 조회 요청: 종목={}, 간격={}, 시간범위={}~{}", 
                     stockSymbol, minuteInterval, startTime, endTime);
            
            List<StockMinutePrice> prices = stockMinutePriceService
                    .getMinutePricesByTimeRange(stockSymbol, minuteInterval, startTime, endTime);
            
            log.info("분봉 데이터 범위 조회 완료: 종목={}, 간격={}, 개수={}", stockSymbol, minuteInterval, prices.size());
            
            return ResponseEntity.ok(prices);
        } catch (Exception e) {
            log.error("분봉 데이터 범위 조회 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{stockSymbol}/{minuteInterval}/count")
    public ResponseEntity<Long> getMinutePriceCount(
            @PathVariable String stockSymbol,
            @PathVariable StockMinutePrice.MinuteInterval minuteInterval) {
        
        try {
            long count = stockMinutePriceService.getMinutePriceCount(stockSymbol, minuteInterval);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("분봉 데이터 개수 조회 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{stockSymbol}/{minuteInterval}/cleanup")
    public ResponseEntity<Void> cleanupOldMinutePrices(
            @PathVariable String stockSymbol,
            @PathVariable StockMinutePrice.MinuteInterval minuteInterval,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cutoffTime) {
        
        try {
            log.info("오래된 분봉 데이터 정리 요청: 종목={}, 간격={}, 기준시간={}", 
                     stockSymbol, minuteInterval, cutoffTime);
            
            stockMinutePriceService.cleanupOldMinutePrices(stockSymbol, minuteInterval, cutoffTime);
            
            log.info("오래된 분봉 데이터 정리 완료: 종목={}, 간격={}", stockSymbol, minuteInterval);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("오래된 분봉 데이터 정리 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{stockSymbol}")
    public ResponseEntity<Void> deleteAllMinutePrices(@PathVariable String stockSymbol) {
        try {
            log.info("종목의 모든 분봉 데이터 삭제 요청: 종목={}", stockSymbol);
            
            stockMinutePriceService.deleteAllMinutePrices(stockSymbol);
            
            log.info("종목의 모든 분봉 데이터 삭제 완료: 종목={}", stockSymbol);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("종목의 모든 분봉 데이터 삭제 실패: 종목={}", stockSymbol, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

