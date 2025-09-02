package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.entity.StockMinutePrice;
import com.hanazoom.domain.stock.repository.StockMinutePriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
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
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (최근 N개)
     */
    public List<StockMinutePrice> getRecentMinutePrices(String stockSymbol, 
                                                       StockMinutePrice.MinuteInterval minuteInterval, 
                                                       int limit) {
        try {
            log.info("🔍 DB에서 분봉 데이터 조회: 종목={}, 간격={}, 제한={}", stockSymbol, minuteInterval, limit);
            
            List<StockMinutePrice> prices = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval);
            
            log.info("📊 DB 조회 결과: 종목={}, 간격={}, 전체 데이터={}개", stockSymbol, minuteInterval, prices.size());
            
            // 최근 N개만 반환하고 시간순 정렬
            List<StockMinutePrice> result = prices.stream()
                    .limit(limit)
                    .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp())) // 시간순 정렬
                    .toList();
            
            log.info("📊 최종 반환 데이터: 종목={}, 간격={}, 반환 데이터={}개", stockSymbol, minuteInterval, result.size());
            
            return result;
        } catch (Exception e) {
            log.error("분봉 데이터 조회 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            throw new RuntimeException("분봉 데이터 조회 실패", e);
        }
    }
    
    /**
     * 특정 종목의 특정 분봉 간격 데이터 조회 (시간 범위 지정, 개선된 버전)
     */
    public List<StockMinutePrice> getMinutePricesByTimeRange(String stockSymbol,
                                                            StockMinutePrice.MinuteInterval minuteInterval,
                                                            LocalDateTime startTime,
                                                            LocalDateTime endTime) {
        try {
            List<StockMinutePrice> prices = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalAndTimestampBetween(
                            stockSymbol, minuteInterval, startTime, endTime);
            
            // 시간순 정렬
            return prices.stream()
                    .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                    .toList();
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
                                       Long cumulativeVolume) {
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
                
                // 이전 종가를 저장 (VWAP 계산용)
                BigDecimal previousClose = candle.getClosePrice();
                
                // 캔들 데이터 업데이트
                candle.setClosePrice(currentPrice);
                candle.setHighPrice(candle.getHighPrice().max(currentPrice));
                candle.setLowPrice(candle.getLowPrice().min(currentPrice));
                candle.setUpdatedAt(now);
                
                // 거래량 계산: 누적 거래량에서 구간별 거래량 계산
                Long intervalVolume = calculateIntervalVolume(stockSymbol, minuteInterval, cumulativeVolume, candleStartTime);
                candle.setVolume(intervalVolume);
                
                // 가격 변화 계산
                BigDecimal change = currentPrice.subtract(candle.getOpenPrice());
                candle.setPriceChange(change);
                if (candle.getOpenPrice().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal changePercent = change.divide(candle.getOpenPrice(), 4, BigDecimal.ROUND_HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                    candle.setPriceChangePercent(changePercent);
                }
                
                // VWAP 계산 (거래량 가중 평균가)
                candle.setVwap(calculateVWAP(candle.getOpenPrice(), previousClose, currentPrice, intervalVolume));
                
                // 틱 카운트 증가
                candle.setTickCount(candle.getTickCount() + 1);
                
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
                        .volume(0L) // 초기 거래량은 0으로 설정
                        .priceChange(BigDecimal.ZERO)
                        .priceChangePercent(BigDecimal.ZERO)
                        .vwap(currentPrice)
                        .tickCount(1)
                        .build();
                
                stockMinutePriceRepository.save(newCandle);
            }
        } catch (Exception e) {
            log.error("분봉 데이터 업데이트 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
        }
    }

    /**
     * 캔들 시작 시간 계산 (개선된 버전)
     */
    private LocalDateTime getCandleStartTime(LocalDateTime time, StockMinutePrice.MinuteInterval interval) {
        int minutes = interval.getMinutes();
        
        // 현재 시간을 분 단위로 변환
        long totalMinutes = time.getHour() * 60 + time.getMinute();
        
        // 캔들 시작 시간 계산
        long candleStartMinutes = (totalMinutes / minutes) * minutes;
        
        // LocalDateTime으로 변환
        int hour = (int) (candleStartMinutes / 60);
        int minute = (int) (candleStartMinutes % 60);
        
        return time.withHour(hour).withMinute(minute).withSecond(0).withNano(0);
    }
    
    /**
     * 구간별 거래량 계산
     */
    private Long calculateIntervalVolume(String stockSymbol, 
                                       StockMinutePrice.MinuteInterval minuteInterval,
                                       Long currentCumulativeVolume, 
                                       LocalDateTime candleStartTime) {
        try {
            // 이전 캔들의 누적 거래량 조회
            List<StockMinutePrice> previousCandles = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval);
            
            // 현재 캔들 시작 시간 이전의 가장 최근 캔들 찾기
            Optional<StockMinutePrice> previousCandle = previousCandles.stream()
                    .filter(p -> p.getTimestamp().isBefore(candleStartTime))
                    .findFirst();
            
            if (previousCandle.isPresent()) {
                // 이전 캔들의 누적 거래량을 Redis에서 조회하거나 계산
                String cacheKey = "cumulative_volume:" + stockSymbol + ":" + previousCandle.get().getTimestamp();
                String cachedVolume = (String) redisTemplate.opsForValue().get(cacheKey);
                
                if (cachedVolume != null) {
                    Long previousCumulativeVolume = Long.parseLong(cachedVolume);
                    return currentCumulativeVolume - previousCumulativeVolume;
                }
            }
            
            // 이전 데이터가 없으면 현재 누적 거래량을 그대로 사용
            return currentCumulativeVolume;
            
        } catch (Exception e) {
            log.warn("구간별 거래량 계산 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            return currentCumulativeVolume;
        }
    }
    
    /**
     * VWAP (거래량 가중 평균가) 계산
     */
    private BigDecimal calculateVWAP(BigDecimal openPrice, 
                                   BigDecimal previousClose, 
                                   BigDecimal currentPrice, 
                                   Long volume) {
        try {
            if (volume == null || volume == 0) {
                return currentPrice;
            }
            
            // 간단한 VWAP 계산: (시가 + 종가) / 2
            // 실제로는 각 거래별 가격과 수량을 고려해야 하지만, 
            // 실시간 데이터에서는 이전 종가와 현재가를 사용
            BigDecimal typicalPrice = openPrice.add(currentPrice).divide(BigDecimal.valueOf(2), 2, BigDecimal.ROUND_HALF_UP);
            
            return typicalPrice;
            
        } catch (Exception e) {
            log.warn("VWAP 계산 실패", e);
            return currentPrice;
        }
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
