package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.entity.StockMinutePrice;
import com.hanazoom.domain.stock.repository.StockMinutePriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockMinutePriceService {

    private final StockMinutePriceRepository stockMinutePriceRepository;

    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (최근 N개)
     */
    public List<StockMinutePrice> getRecentMinutePrices(String stockSymbol, 
                                                       StockMinutePrice.MinuteInterval minuteInterval, 
                                                       int limit) {
        try {
            List<StockMinutePrice> prices = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval);
            
            // 최근 N개만 반환
            return prices.stream()
                    .limit(limit)
                    .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp())) // 시간순 정렬
                    .toList();
        } catch (Exception e) {
            log.error("분봉 데이터 조회 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            throw new RuntimeException("분봉 데이터 조회 실패", e);
        }
    }

    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (시간 범위 지정)
     */
    public List<StockMinutePrice> getMinutePricesByTimeRange(String stockSymbol,
                                                            StockMinutePrice.MinuteInterval minuteInterval,
                                                            LocalDateTime startTime,
                                                            LocalDateTime endTime) {
        try {
            return stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalAndTimestampBetween(
                            stockSymbol, minuteInterval, startTime, endTime);
        } catch (Exception e) {
            log.error("분봉 데이터 조회 실패: 종목={}, 간격={}, 시간범위={}~{}", 
                     stockSymbol, minuteInterval, startTime, endTime, e);
            throw new RuntimeException("분봉 데이터 조회 실패", e);
        }
    }

    /**
     * 분봉 데이터 저장
     */
    @Transactional
    public StockMinutePrice saveMinutePrice(StockMinutePrice minutePrice) {
        try {
            // 중복 데이터 체크
            Optional<StockMinutePrice> existing = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(
                            minutePrice.getStockSymbol(), minutePrice.getMinuteInterval())
                    .stream()
                    .filter(p -> p.getTimestamp().equals(minutePrice.getTimestamp()))
                    .findFirst();

            if (existing.isPresent()) {
                return existing.get();
            }

            StockMinutePrice saved = stockMinutePriceRepository.save(minutePrice);
            return saved;
        } catch (Exception e) {
            log.error("분봉 데이터 저장 실패: 종목={}, 간격={}, 시간={}", 
                     minutePrice.getStockSymbol(), minutePrice.getMinuteInterval(), 
                     minutePrice.getTimestamp(), e);
            throw new RuntimeException("분봉 데이터 저장 실패", e);
        }
    }

    /**
     * 실시간 주식 데이터로 분봉 데이터 업데이트
     */
    @Transactional
    public void updateCurrentMinutePrice(String stockSymbol, 
                                       StockMinutePrice.MinuteInterval minuteInterval,
                                       BigDecimal currentPrice, 
                                       Long volume) {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime candleStartTime = getCandleStartTime(now, minuteInterval);
            
            // 현재 캔들 데이터 조회 또는 생성
            Optional<StockMinutePrice> currentCandle = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval)
                    .stream()
                    .filter(p -> p.getTimestamp().equals(candleStartTime))
                    .findFirst();

            if (currentCandle.isPresent()) {
                // 기존 캔들 업데이트
                StockMinutePrice candle = currentCandle.get();
                candle.setClosePrice(currentPrice);
                candle.setHighPrice(candle.getHighPrice().max(currentPrice));
                candle.setLowPrice(candle.getLowPrice().min(currentPrice));
                candle.setVolume(candle.getVolume() + volume);
                candle.setUpdatedAt(now);
                
                // 가격 변화 계산
                BigDecimal change = currentPrice.subtract(candle.getOpenPrice());
                candle.setPriceChange(change);
                if (candle.getOpenPrice().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal changePercent = change.divide(candle.getOpenPrice(), 4, BigDecimal.ROUND_HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                    candle.setPriceChangePercent(changePercent);
                }
                
                stockMinutePriceRepository.save(candle);
            } else {
                // 새로운 캔들 생성
                StockMinutePrice newCandle = StockMinutePrice.builder()
                        .stockSymbol(stockSymbol)
                        .minuteInterval(minuteInterval)
                        .timestamp(candleStartTime)
                        .openPrice(currentPrice)
                        .highPrice(currentPrice)
                        .lowPrice(currentPrice)
                        .closePrice(currentPrice)
                        .volume(volume)
                        .priceChange(BigDecimal.ZERO)
                        .priceChangePercent(BigDecimal.ZERO)
                        .tickCount(1)
                        .build();
                
                stockMinutePriceRepository.save(newCandle);
            }
        } catch (Exception e) {
            log.error("분봉 데이터 업데이트 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
        }
    }

    /**
     * 캔들 시작 시간 계산
     */
    private LocalDateTime getCandleStartTime(LocalDateTime time, StockMinutePrice.MinuteInterval interval) {
        int minutes = interval.getMinutes();
        int minuteOfDay = time.getMinute();
        int adjustedMinute = (minuteOfDay / minutes) * minutes;
        
        return time.withMinute(adjustedMinute).withSecond(0).withNano(0);
    }

    /**
     * 특정 종목의 특정 분봉 간격 데이터 개수 조회
     */
    public long getMinutePriceCount(String stockSymbol, StockMinutePrice.MinuteInterval minuteInterval) {
        return stockMinutePriceRepository.countByStockSymbolAndMinuteInterval(stockSymbol, minuteInterval);
    }

    /**
     * 오래된 분봉 데이터 정리
     */
    @Transactional
    public void cleanupOldMinutePrices(String stockSymbol, 
                                     StockMinutePrice.MinuteInterval minuteInterval,
                                     LocalDateTime cutoffTime) {
        try {
            stockMinutePriceRepository.deleteOldData(stockSymbol, minuteInterval, cutoffTime);
            log.info("오래된 분봉 데이터 정리 완료: 종목={}, 간격={}, 기준시간={}", 
                    stockSymbol, minuteInterval, cutoffTime);
        } catch (Exception e) {
            log.error("오래된 분봉 데이터 정리 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
        }
    }

    /**
     * 특정 종목의 모든 분봉 데이터 삭제
     */
    @Transactional
    public void deleteAllMinutePrices(String stockSymbol) {
        try {
            stockMinutePriceRepository.deleteByStockSymbol(stockSymbol);
            log.info("종목의 모든 분봉 데이터 삭제 완료: 종목={}", stockSymbol);
        } catch (Exception e) {
            log.error("종목의 모든 분봉 데이터 삭제 실패: 종목={}", stockSymbol, e);
        }
    }
}
