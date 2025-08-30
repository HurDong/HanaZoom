package com.hanazoom.domain.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.domain.stock.dto.CandleData;
import com.hanazoom.global.service.KisApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import com.hanazoom.domain.stock.entity.StockMinutePrice;
import com.hanazoom.domain.stock.service.StockMinutePriceService;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockChartServiceImpl implements StockChartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final KisApiService kisApiService;
    private final ObjectMapper objectMapper;
    private final Random random = new Random(); // 더미 데이터용
    private final StockMinutePriceService stockMinutePriceService;

    @Override
    public List<CandleData> getChartData(String stockCode, String timeframe, int limit) {
        try {
            log.info("차트 데이터 조회 시작: 종목={}, 시간봉={}, 제한={}", stockCode, timeframe, limit);
            
            // 분봉 데이터인 경우 DB에서 조회 시도
            if (isMinuteTimeframe(timeframe)) {
                List<CandleData> dbData = getMinuteDataFromDB(stockCode, timeframe, limit);
                if (!dbData.isEmpty()) {
                    log.info("DB에서 분봉 데이터 조회 완료: 종목={}, 시간봉={}, 개수={}", stockCode, timeframe, dbData.size());
                    return dbData;
                }
            }

            // DB에 데이터가 없거나 다른 시간봉인 경우 KIS API 호출
            String kisResponse;
            if (timeframe.equals("1D") || timeframe.equals("1W") || timeframe.equals("1MO")) {
                // 일봉/주봉/월봉 데이터
                String period = timeframe.equals("1D") ? "D" : timeframe.equals("1W") ? "W" : "M";
                kisResponse = kisApiService.getDailyChartData(stockCode, period, "1");
            } else {
                // 분봉 데이터 (1M, 5M, 15M, 1H)
                String minuteCode = convertToKisMinuteCode(timeframe);
                kisResponse = kisApiService.getMinuteChartData(stockCode, minuteCode, "1");
            }

            // KIS 응답 파싱
            List<CandleData> parsedData = parseKisChartResponse(kisResponse, stockCode, timeframe, limit);
            
            // 분봉 데이터인 경우 DB에 저장
            if (isMinuteTimeframe(timeframe)) {
                saveMinuteDataToDB(stockCode, timeframe, parsedData);
            }
            
            return parsedData;
            
        } catch (Exception e) {
            log.error("KIS 차트 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
            // 실패 시 더미 데이터 반환
            return generateDummyChartData(stockCode, timeframe, limit);
        }
    }

    /**
     * KIS API에서 실제 차트 데이터 조회
     */
    private List<CandleData> getChartDataFromKis(String stockCode, String timeframe, int limit) {
        try {
            String kisResponse;
            
            // 시간봉에 따라 다른 API 호출
            if (timeframe.equals("1D") || timeframe.equals("1W") || timeframe.equals("1MO")) {
                // 일봉/주봉/월봉 데이터
                String period = timeframe.equals("1D") ? "D" : timeframe.equals("1W") ? "W" : "M";
                kisResponse = kisApiService.getDailyChartData(stockCode, period, "1");
            } else {
                // 분봉 데이터 (1M, 5M, 15M, 1H)
                String minuteCode = convertToKisMinuteCode(timeframe);
                kisResponse = kisApiService.getMinuteChartData(stockCode, minuteCode, "1");
            }

            // KIS 응답 파싱
            return parseKisChartResponse(kisResponse, stockCode, timeframe, limit);
            
        } catch (Exception e) {
            log.error("KIS 차트 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
            throw new RuntimeException("KIS 차트 데이터 조회 실패", e);
        }
    }

    /**
     * 시간봉을 KIS API 분봉 코드로 변환
     */
    private String convertToKisMinuteCode(String timeframe) {
        switch (timeframe) {
            case "1M": return "01";
            case "5M": return "05";
            case "15M": return "15";
            case "1H": return "60";
            default: return "01";
        }
    }

    /**
     * KIS API 응답을 CandleData 리스트로 파싱
     */
    private List<CandleData> parseKisChartResponse(String kisResponse, String stockCode, String timeframe, int limit) {
        List<CandleData> candleList = new ArrayList<>();
        
        try {
            JsonNode rootNode = objectMapper.readTree(kisResponse);
            JsonNode outputArray = rootNode.path("output2");
            
            if (outputArray.isArray()) {
                int count = 0;
                for (JsonNode item : outputArray) {
                    if (count >= limit) break;
                    
                    // KIS 차트 데이터 필드 파싱
                    String date = item.path("stck_bsop_date").asText(); // 영업일자
                    String openPrice = item.path("stck_oprc").asText(); // 시가
                    String highPrice = item.path("stck_hgpr").asText(); // 고가
                    String lowPrice = item.path("stck_lwpr").asText(); // 저가
                    String closePrice = item.path("stck_clpr").asText(); // 종가
                    String volume = item.path("acml_vol").asText(); // 누적거래량
                    String changePrice = item.path("prdy_vrss").asText(); // 전일대비
                    String changeRate = item.path("prdy_vrss_rate").asText(); // 전일대비율
                    
                    // 등락구분 계산
                    String changeSign = calculateChangeSign(changePrice);
                    
                    // LocalDateTime 변환
                    LocalDateTime dateTime = parseDateTime(date, timeframe);
                    
                    CandleData candle = CandleData.builder()
                            .stockCode(stockCode)
                            .dateTime(dateTime)
                            .timeframe(timeframe)
                            .openPrice(openPrice)
                            .highPrice(highPrice)
                            .lowPrice(lowPrice)
                            .closePrice(closePrice)
                            .volume(volume)
                            .changePrice(changePrice)
                            .changeRate(changeRate)
                            .changeSign(changeSign)
                            .isComplete(true) // KIS 과거 데이터는 모두 완성된 캔들
                            .timestamp(dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                            .build();
                    
                    candleList.add(candle);
                    count++;
                }
            }
            
            log.info("KIS 차트 데이터 파싱 완료: 종목={}, 캔들수={}", stockCode, candleList.size());
            
        } catch (Exception e) {
            log.error("KIS 차트 응답 파싱 실패", e);
            throw new RuntimeException("차트 데이터 파싱 실패", e);
        }
        
        return candleList;
    }

    /**
     * 날짜 문자열을 LocalDateTime으로 변환
     */
    private LocalDateTime parseDateTime(String dateStr, String timeframe) {
        try {
            // KIS API에서 받은 날짜 형식: YYYYMMDD
            int year = Integer.parseInt(dateStr.substring(0, 4));
            int month = Integer.parseInt(dateStr.substring(4, 6));
            int day = Integer.parseInt(dateStr.substring(6, 8));
            
            return LocalDateTime.of(year, month, day, 9, 0); // 장 시작 시간으로 설정
        } catch (Exception e) {
            log.warn("날짜 파싱 실패, 현재 시간 사용: {}", dateStr);
            return LocalDateTime.now();
        }
    }

    /**
     * 전일대비 값으로 등락구분 계산
     */
    private String calculateChangeSign(String changePrice) {
        try {
            double change = Double.parseDouble(changePrice);
            if (change > 0) return "2"; // 상승
            if (change < 0) return "4"; // 하락
            return "3"; // 보합
        } catch (Exception e) {
            return "3"; // 기본값
        }
    }

    @Override
    public CandleData getCurrentCandle(String stockCode, String timeframe) {
        // Redis에서 현재 캔들 조회
        String key = "candle:current:" + stockCode + ":" + timeframe;
        CandleData currentCandle = (CandleData) redisTemplate.opsForValue().get(key);
        
        if (currentCandle == null) {
            // 현재 캔들이 없으면 새로 생성
            currentCandle = createDummyCurrentCandle(stockCode, timeframe);
            redisTemplate.opsForValue().set(key, currentCandle);
        }
        
        return currentCandle;
    }

    @Override
    public void updateCurrentCandle(String stockCode, String currentPrice, String volume) {
        // 모든 시간봉의 현재 캔들 업데이트
        String[] timeframes = {"1M", "5M", "15M", "1H", "1D", "1W", "1MO"};
        
        for (String timeframe : timeframes) {
            String key = "candle:current:" + stockCode + ":" + timeframe;
            CandleData currentCandle = (CandleData) redisTemplate.opsForValue().get(key);
            
            if (currentCandle != null) {
                currentCandle.updateWithRealtime(currentPrice, volume);
                redisTemplate.opsForValue().set(key, currentCandle);
            }
        }
    }

    @Override
    public void createNewCandle(String stockCode, String timeframe, String openPrice) {
        String key = "candle:current:" + stockCode + ":" + timeframe;
        
        CandleData newCandle = CandleData.builder()
                .stockCode(stockCode)
                .dateTime(LocalDateTime.now())
                .timeframe(timeframe)
                .openPrice(openPrice)
                .highPrice(openPrice)
                .lowPrice(openPrice)
                .closePrice(openPrice)
                .volume("0")
                .changePrice("0")
                .changeRate("0.00")
                .changeSign("3")
                .isComplete(false)
                .timestamp(System.currentTimeMillis())
                .build();
        
        redisTemplate.opsForValue().set(key, newCandle);
        log.info("새 캔들 생성: 종목={}, 시간봉={}, 시가={}", stockCode, timeframe, openPrice);
    }

    /**
     * 더미 차트 데이터 생성 (과거 데이터 시뮬레이션)
     */
    private List<CandleData> generateDummyChartData(String stockCode, String timeframe, int limit) {
        List<CandleData> candleList = new ArrayList<>();
        
        // 기본 가격 설정
        double basePrice = getBasePriceForStock(stockCode);
        LocalDateTime currentTime = LocalDateTime.now();
        
        // 시간봉에 따른 시간 간격 계산
        int minutesInterval = getMinutesInterval(timeframe);
        
        for (int i = limit - 1; i >= 0; i--) {
            LocalDateTime candleTime = currentTime.minusMinutes((long) i * minutesInterval);
            
            // 가격 변동 시뮬레이션
            double priceVariation = (random.nextDouble() - 0.5) * 0.1; // ±5% 변동
            double currentPrice = basePrice * (1 + priceVariation);
            
            double open = currentPrice * (0.98 + random.nextDouble() * 0.04); // ±2%
            double high = Math.max(open, currentPrice) * (1 + random.nextDouble() * 0.02);
            double low = Math.min(open, currentPrice) * (1 - random.nextDouble() * 0.02);
            double close = currentPrice;
            
            CandleData candle = CandleData.builder()
                    .stockCode(stockCode)
                    .dateTime(candleTime)
                    .timeframe(timeframe)
                    .openPrice(String.valueOf((int) open))
                    .highPrice(String.valueOf((int) high))
                    .lowPrice(String.valueOf((int) low))
                    .closePrice(String.valueOf((int) close))
                    .volume(String.valueOf(10000 + random.nextInt(50000)))
                    .changePrice(String.valueOf((int) (close - open)))
                    .changeRate(String.format("%.2f", ((close - open) / open) * 100))
                    .changeSign(close > open ? "2" : close < open ? "4" : "3")
                    .isComplete(i > 0) // 마지막(현재) 캔들은 미완성
                    .timestamp(candleTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                    .build();
            
            candleList.add(candle);
            basePrice = close; // 다음 캔들의 기준가로 사용
        }
        
        return candleList;
    }

    /**
     * 현재 더미 캔들 생성
     */
    private CandleData createDummyCurrentCandle(String stockCode, String timeframe) {
        double basePrice = getBasePriceForStock(stockCode);
        
        return CandleData.builder()
                .stockCode(stockCode)
                .dateTime(LocalDateTime.now())
                .timeframe(timeframe)
                .openPrice(String.valueOf((int) basePrice))
                .highPrice(String.valueOf((int) basePrice))
                .lowPrice(String.valueOf((int) basePrice))
                .closePrice(String.valueOf((int) basePrice))
                .volume("0")
                .changePrice("0")
                .changeRate("0.00")
                .changeSign("3")
                .isComplete(false)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 종목별 기본 가격
     */
    private double getBasePriceForStock(String stockCode) {
        switch (stockCode) {
            case "005930": return 71000;  // 삼성전자
            case "000660": return 89000;  // SK하이닉스
            case "035420": return 170000; // NAVER
            case "035720": return 45000;  // 카카오
            case "005380": return 45000;  // 현대자동차
            case "051910": return 380000; // LG화학
            case "207940": return 850000; // 삼성바이오로직스
            case "068270": return 160000; // 셀트리온
            case "323410": return 25000;  // 카카오뱅크
            case "373220": return 400000; // LG에너지솔루션
            default: return 10000;
        }
    }

    /**
     * 시간봉별 분 간격 계산
     */
    private int getMinutesInterval(String timeframe) {
        switch (timeframe) {
            case "1M": return 1;
            case "5M": return 5;
            case "15M": return 15;
            case "1H": return 60;
            case "1D": return 60 * 24;
            case "1W": return 60 * 24 * 7;
            case "1MO": return 60 * 24 * 30;
            default: return 60 * 24; // 기본 일봉
        }
    }

    /**
     * 분봉 시간봉인지 확인
     */
    private boolean isMinuteTimeframe(String timeframe) {
        return timeframe.equals("1M") || timeframe.equals("5M") || timeframe.equals("15M") || timeframe.equals("1H");
    }

    /**
     * 분봉 데이터를 DB에서 조회
     */
    private List<CandleData> getMinuteDataFromDB(String stockCode, String timeframe, int limit) {
        try {
            // StockMinutePriceService를 통해 분봉 데이터 조회
            StockMinutePrice.MinuteInterval interval = convertToMinuteInterval(timeframe);
            List<StockMinutePrice> minutePrices = stockMinutePriceService.getRecentMinutePrices(stockCode, interval, limit);
            
            return minutePrices.stream()
                    .map(this::convertToCandleData)
                    .toList();
        } catch (Exception e) {
            log.warn("DB에서 분봉 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
            return new ArrayList<>();
        }
    }

    /**
     * 분봉 데이터를 DB에 저장
     */
    private void saveMinuteDataToDB(String stockCode, String timeframe, List<CandleData> data) {
        try {
            StockMinutePrice.MinuteInterval interval = convertToMinuteInterval(timeframe);
            
            for (CandleData candleData : data) {
                StockMinutePrice minutePrice = StockMinutePrice.builder()
                        .stockSymbol(stockCode)
                        .minuteInterval(interval)
                        .timestamp(candleData.getDateTime())
                        .openPrice(new BigDecimal(candleData.getOpenPrice()))
                        .highPrice(new BigDecimal(candleData.getHighPrice()))
                        .lowPrice(new BigDecimal(candleData.getLowPrice()))
                        .closePrice(new BigDecimal(candleData.getClosePrice()))
                        .volume(Long.parseLong(candleData.getVolume()))
                        .priceChange(new BigDecimal(candleData.getChangePrice()))
                        .priceChangePercent(new BigDecimal(candleData.getChangeRate()))
                        .tickCount(1)
                        .build();
                
                stockMinutePriceService.saveMinutePrice(minutePrice);
            }
            
            log.info("분봉 데이터 DB 저장 완료: 종목={}, 시간봉={}, 개수={}", stockCode, timeframe, data.size());
        } catch (Exception e) {
            log.error("분봉 데이터 DB 저장 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
        }
    }

    /**
     * StockMinutePrice를 CandleData로 변환
     */
    private CandleData convertToCandleData(StockMinutePrice minutePrice) {
        return CandleData.builder()
                .stockCode(minutePrice.getStockSymbol())
                .dateTime(minutePrice.getTimestamp())
                .timeframe(minutePrice.getMinuteInterval().name())
                .openPrice(minutePrice.getOpenPrice().toString())
                .highPrice(minutePrice.getHighPrice().toString())
                .lowPrice(minutePrice.getLowPrice().toString())
                .closePrice(minutePrice.getClosePrice().toString())
                .volume(minutePrice.getVolume().toString())
                .changePrice(minutePrice.getPriceChange().toString())
                .changeRate(minutePrice.getPriceChangePercent().toString())
                .changeSign(calculateChangeSign(minutePrice.getPriceChange().toString()))
                .isComplete(true)
                .timestamp(minutePrice.getTimestamp().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }

    /**
     * 시간봉을 MinuteInterval으로 변환
     */
    private StockMinutePrice.MinuteInterval convertToMinuteInterval(String timeframe) {
        switch (timeframe) {
            case "1M": return StockMinutePrice.MinuteInterval.ONE_MINUTE;
            case "5M": return StockMinutePrice.MinuteInterval.FIVE_MINUTES;
            case "15M": return StockMinutePrice.MinuteInterval.FIFTEEN_MINUTES;
            default: return StockMinutePrice.MinuteInterval.FIVE_MINUTES;
        }
    }
}
