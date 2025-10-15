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

    public List<StockMinutePrice> getRecentMinutePrices(String stockSymbol, 
                                                       StockMinutePrice.MinuteInterval minuteInterval, 
                                                       int limit) {
        try {
            log.info("🔍 DB에서 분봉 데이터 조회: 종목={}, 간격={}, 제한={}", stockSymbol, minuteInterval, limit);
            
            List<StockMinutePrice> prices = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval);
            
            log.info("📊 DB 조회 결과: 종목={}, 간격={}, 전체 데이터={}개", stockSymbol, minuteInterval, prices.size());
            

            List<StockMinutePrice> result = prices.stream()
                    .limit(limit)
                    .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp())) 
                    .toList();
            
            log.info("📊 최종 반환 데이터: 종목={}, 간격={}, 반환 데이터={}개", stockSymbol, minuteInterval, result.size());
            
            return result;
        } catch (Exception e) {
            log.error("분봉 데이터 조회 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            throw new RuntimeException("분봉 데이터 조회 실패", e);
        }
    }
    
    public List<StockMinutePrice> getMinutePricesByTimeRange(String stockSymbol,
                                                            StockMinutePrice.MinuteInterval minuteInterval,
                                                            LocalDateTime startTime,
                                                            LocalDateTime endTime) {
        try {
            List<StockMinutePrice> prices = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalAndTimestampBetween(
                            stockSymbol, minuteInterval, startTime, endTime);
            

            return prices.stream()
                    .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                    .toList();
        } catch (Exception e) {
            log.error("분봉 데이터 조회 실패: 종목={}, 간격={}, 시간범위={}~{}", 
                     stockSymbol, minuteInterval, startTime, endTime, e);
            throw new RuntimeException("분봉 데이터 조회 실패", e);
        }
    }



    @Transactional
    public StockMinutePrice saveMinutePrice(StockMinutePrice minutePrice) {
        try {

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

    @Transactional
    public void updateCurrentMinutePrice(String stockSymbol, 
                                       StockMinutePrice.MinuteInterval minuteInterval,
                                       BigDecimal currentPrice, 
                                       Long cumulativeVolume) {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime candleStartTime = getCandleStartTime(now, minuteInterval);
            

            Optional<StockMinutePrice> currentCandle = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval)
                    .stream()
                    .filter(p -> p.getTimestamp().equals(candleStartTime))
                    .findFirst();

            if (currentCandle.isPresent()) {

                StockMinutePrice candle = currentCandle.get();
                

                BigDecimal previousClose = candle.getClosePrice();
                

                candle.setClosePrice(currentPrice);
                candle.setHighPrice(candle.getHighPrice().max(currentPrice));
                candle.setLowPrice(candle.getLowPrice().min(currentPrice));
                candle.setUpdatedAt(now);
                

                Long intervalVolume = calculateIntervalVolume(stockSymbol, minuteInterval, cumulativeVolume, candleStartTime);
                candle.setVolume(intervalVolume);
                

                BigDecimal change = currentPrice.subtract(candle.getOpenPrice());
                candle.setPriceChange(change);
                if (candle.getOpenPrice().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal changePercent = change.divide(candle.getOpenPrice(), 4, BigDecimal.ROUND_HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                    candle.setPriceChangePercent(changePercent);
                }
                

                candle.setVwap(calculateVWAP(candle.getOpenPrice(), previousClose, currentPrice, intervalVolume));
                

                candle.setTickCount(candle.getTickCount() + 1);
                
                stockMinutePriceRepository.save(candle);
            } else {

                StockMinutePrice newCandle = StockMinutePrice.builder()
                        .stockSymbol(stockSymbol)
                        .minuteInterval(minuteInterval)
                        .timestamp(candleStartTime)
                        .openPrice(currentPrice)
                        .highPrice(currentPrice)
                        .lowPrice(currentPrice)
                        .closePrice(currentPrice)
                        .volume(0L) 
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

    private LocalDateTime getCandleStartTime(LocalDateTime time, StockMinutePrice.MinuteInterval interval) {
        int minutes = interval.getMinutes();
        

        long totalMinutes = time.getHour() * 60 + time.getMinute();
        

        long candleStartMinutes = (totalMinutes / minutes) * minutes;
        

        int hour = (int) (candleStartMinutes / 60);
        int minute = (int) (candleStartMinutes % 60);
        
        return time.withHour(hour).withMinute(minute).withSecond(0).withNano(0);
    }
    
    private Long calculateIntervalVolume(String stockSymbol, 
                                       StockMinutePrice.MinuteInterval minuteInterval,
                                       Long currentCumulativeVolume, 
                                       LocalDateTime candleStartTime) {
        try {

            List<StockMinutePrice> previousCandles = stockMinutePriceRepository
                    .findByStockSymbolAndMinuteIntervalOrderByTimestampDesc(stockSymbol, minuteInterval);
            

            Optional<StockMinutePrice> previousCandle = previousCandles.stream()
                    .filter(p -> p.getTimestamp().isBefore(candleStartTime))
                    .findFirst();
            
            if (previousCandle.isPresent()) {

                String cacheKey = "cumulative_volume:" + stockSymbol + ":" + previousCandle.get().getTimestamp();
                String cachedVolume = (String) redisTemplate.opsForValue().get(cacheKey);
                
                if (cachedVolume != null) {
                    Long previousCumulativeVolume = Long.parseLong(cachedVolume);
                    return currentCumulativeVolume - previousCumulativeVolume;
                }
            }
            

            return currentCumulativeVolume;
            
        } catch (Exception e) {
            log.warn("구간별 거래량 계산 실패: 종목={}, 간격={}", stockSymbol, minuteInterval, e);
            return currentCumulativeVolume;
        }
    }
    
    private BigDecimal calculateVWAP(BigDecimal openPrice, 
                                   BigDecimal previousClose, 
                                   BigDecimal currentPrice, 
                                   Long volume) {
        try {
            if (volume == null || volume == 0) {
                return currentPrice;
            }
            



            BigDecimal typicalPrice = openPrice.add(currentPrice).divide(BigDecimal.valueOf(2), 2, BigDecimal.ROUND_HALF_UP);
            
            return typicalPrice;
            
        } catch (Exception e) {
            log.warn("VWAP 계산 실패", e);
            return currentPrice;
        }
    }

    public long getMinutePriceCount(String stockSymbol, StockMinutePrice.MinuteInterval minuteInterval) {
        return stockMinutePriceRepository.countByStockSymbolAndMinuteInterval(stockSymbol, minuteInterval);
    }

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
