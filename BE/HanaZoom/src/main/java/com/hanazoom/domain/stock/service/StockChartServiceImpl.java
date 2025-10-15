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
import com.hanazoom.domain.stock.entity.StockDailyPrice;
import com.hanazoom.domain.stock.entity.StockWeeklyPrice;
import com.hanazoom.domain.stock.entity.StockMonthlyPrice;
import com.hanazoom.domain.stock.repository.StockDailyPriceRepository;
import com.hanazoom.domain.stock.repository.StockWeeklyPriceRepository;
import com.hanazoom.domain.stock.repository.StockMonthlyPriceRepository;
import com.hanazoom.domain.stock.service.StockMinutePriceService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockChartServiceImpl implements StockChartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final KisApiService kisApiService;
    private final ObjectMapper objectMapper;
    private final Random random = new Random(); 
    private final StockMinutePriceService stockMinutePriceService;
    private final StockDailyPriceRepository dailyPriceRepository;
    private final StockWeeklyPriceRepository weeklyPriceRepository;
    private final StockMonthlyPriceRepository monthlyPriceRepository;

    @Override
    public List<CandleData> getChartData(String stockCode, String timeframe, int limit) {
        try {
            log.info("차트 데이터 조회 시작: 종목={}, 시간봉={}, 제한={}", stockCode, timeframe, limit);
            

            if (isMinuteTimeframe(timeframe)) {
                List<CandleData> dbData = getMinuteDataFromDB(stockCode, timeframe, limit);
                if (!dbData.isEmpty()) {
                    log.info("DB에서 분봉 데이터 조회 완료: 종목={}, 시간봉={}, 개수={}", stockCode, timeframe, dbData.size());
                    return dbData;
                }
            }


            if (timeframe.equals("1D") || timeframe.equals("1W") || timeframe.equals("1MO")) {
                List<CandleData> dbData = getDailyWeeklyMonthlyDataFromDB(stockCode, timeframe, limit);
                if (!dbData.isEmpty()) {
                    log.info("DB에서 일/주/월봉 데이터 조회 완료: 종목={}, 시간봉={}, 개수={}", stockCode, timeframe, dbData.size());
                    return dbData;
                }
            }


            String kisResponse;
            if (timeframe.equals("1D") || timeframe.equals("1W") || timeframe.equals("1MO")) {

                String period = timeframe.equals("1D") ? "D" : timeframe.equals("1W") ? "W" : "M";
                kisResponse = kisApiService.getDailyChartDataWithDateRange(stockCode, period, "1", null, null);
            } else {

                String minuteCode = convertToKisMinuteCode(timeframe);
                kisResponse = kisApiService.getMinuteChartData(stockCode, minuteCode, "1");
            }


            List<CandleData> parsedData = parseKisChartResponse(kisResponse, stockCode, timeframe, limit);
            

            if (isMinuteTimeframe(timeframe)) {
                saveMinuteDataToDB(stockCode, timeframe, parsedData);
            }
            
            return parsedData;
            
        } catch (Exception e) {
            log.error("KIS 차트 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);

            return generateDummyChartData(stockCode, timeframe, limit);
        }
    }

    private List<CandleData> getChartDataFromKis(String stockCode, String timeframe, int limit) {
        try {
            String kisResponse;
            

            if (timeframe.equals("1D") || timeframe.equals("1W") || timeframe.equals("1MO")) {

                String period = timeframe.equals("1D") ? "D" : timeframe.equals("1W") ? "W" : "M";
                kisResponse = kisApiService.getDailyChartData(stockCode, period, "1");
            } else {

                String minuteCode = convertToKisMinuteCode(timeframe);
                kisResponse = kisApiService.getMinuteChartData(stockCode, minuteCode, "1");
            }


            return parseKisChartResponse(kisResponse, stockCode, timeframe, limit);
            
        } catch (Exception e) {
            log.error("KIS 차트 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
            throw new RuntimeException("KIS 차트 데이터 조회 실패", e);
        }
    }

    private String convertToKisMinuteCode(String timeframe) {
        switch (timeframe) {
            case "1M": return "01";
            case "5M": return "05";
            case "15M": return "15";
            case "1H": return "60";
            default: return "01";
        }
    }

    private List<CandleData> parseKisChartResponse(String kisResponse, String stockCode, String timeframe, int limit) {
        List<CandleData> candleList = new ArrayList<>();
        
        try {
            JsonNode rootNode = objectMapper.readTree(kisResponse);
            JsonNode outputArray = rootNode.path("output2");
            
            if (outputArray.isArray()) {
                int count = 0;
                for (JsonNode item : outputArray) {
                    if (count >= limit) break;
                    

                    String date = item.path("stck_bsop_date").asText(); 
                    String openPrice = item.path("stck_oprc").asText(); 
                    String highPrice = item.path("stck_hgpr").asText(); 
                    String lowPrice = item.path("stck_lwpr").asText(); 
                    String closePrice = item.path("stck_clpr").asText(); 
                    String volume = item.path("acml_vol").asText(); 
                    String changePrice = item.path("prdy_vrss").asText(); 
                    String changeRate = item.path("prdy_vrss_rate").asText(); 
                    

                    String changeSign = calculateChangeSign(changePrice);
                    

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
                            .isComplete(true) 
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

    private LocalDateTime parseDateTime(String dateStr, String timeframe) {
        try {

            int year = Integer.parseInt(dateStr.substring(0, 4));
            int month = Integer.parseInt(dateStr.substring(4, 6));
            int day = Integer.parseInt(dateStr.substring(6, 8));
            
            return LocalDateTime.of(year, month, day, 9, 0); 
        } catch (Exception e) {
            log.warn("날짜 파싱 실패, 현재 시간 사용: {}", dateStr);
            return LocalDateTime.now();
        }
    }

    private String calculateChangeSign(String changePrice) {
        try {
            double change = Double.parseDouble(changePrice);
            if (change > 0) return "2"; 
            if (change < 0) return "4"; 
            return "3"; 
        } catch (Exception e) {
            return "3"; 
        }
    }

    @Override
    public CandleData getCurrentCandle(String stockCode, String timeframe) {
        try {

            String key = "candle:current:" + stockCode + ":" + timeframe;
            CandleData currentCandle = (CandleData) redisTemplate.opsForValue().get(key);
            
            if (currentCandle == null) {

                currentCandle = createDummyCurrentCandle(stockCode, timeframe);
                try {
                    redisTemplate.opsForValue().set(key, currentCandle);
                } catch (Exception e) {
                    log.warn("Redis 캔들 저장 실패 - 종목: {}, 시간봉: {}, 에러: {}", 
                            stockCode, timeframe, e.getMessage());
                }
            }
            
            return currentCandle;
        } catch (Exception e) {
            log.error("Redis 연결 실패로 캔들 조회 중단 - 종목: {}, 시간봉: {}, 에러: {}", 
                    stockCode, timeframe, e.getMessage());

            return createDummyCurrentCandle(stockCode, timeframe);
        }
    }

    @Override
    public void updateCurrentCandle(String stockCode, String currentPrice, String volume) {
        try {

            String[] timeframes = {"1M", "5M", "15M", "1H", "1D", "1W", "1MO"};
            
            for (String timeframe : timeframes) {
                String key = "candle:current:" + stockCode + ":" + timeframe;
                try {
                    CandleData currentCandle = (CandleData) redisTemplate.opsForValue().get(key);
                    
                    if (currentCandle != null) {
                        currentCandle.updateWithRealtime(currentPrice, volume);
                        redisTemplate.opsForValue().set(key, currentCandle);
                    }
                } catch (Exception e) {
                    log.warn("Redis 캔들 업데이트 실패 - 종목: {}, 시간봉: {}, 에러: {}", 
                            stockCode, timeframe, e.getMessage());

                }
            }
        } catch (Exception e) {
            log.error("Redis 연결 실패로 캔들 업데이트 중단 - 종목: {}, 에러: {}", stockCode, e.getMessage());
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

    private List<CandleData> generateDummyChartData(String stockCode, String timeframe, int limit) {
        List<CandleData> candleList = new ArrayList<>();
        

        double basePrice = getBasePriceForStock(stockCode);
        LocalDateTime currentTime = LocalDateTime.now();
        

        int minutesInterval = getMinutesInterval(timeframe);
        
        for (int i = limit - 1; i >= 0; i--) {
            LocalDateTime candleTime = currentTime.minusMinutes((long) i * minutesInterval);
            

            double priceVariation = (random.nextDouble() - 0.5) * 0.1; 
            double currentPrice = basePrice * (1 + priceVariation);
            
            double open = currentPrice * (0.98 + random.nextDouble() * 0.04); 
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
                    .isComplete(i > 0) 
                    .timestamp(candleTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                    .build();
            
            candleList.add(candle);
            basePrice = close; 
        }
        
        return candleList;
    }

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

    private double getBasePriceForStock(String stockCode) {
        switch (stockCode) {
            case "005930": return 71000;  
            case "000660": return 89000;  
            case "035420": return 170000; 
            case "035720": return 45000;  
            case "005380": return 45000;  
            case "051910": return 380000; 
            case "207940": return 850000; 
            case "068270": return 160000; 
            case "323410": return 25000;  
            case "373220": return 400000; 
            default: return 10000;
        }
    }

    private int getMinutesInterval(String timeframe) {
        switch (timeframe) {
            case "1M": return 1;
            case "5M": return 5;
            case "15M": return 15;
            case "1H": return 60;
            case "1D": return 60 * 24;
            case "1W": return 60 * 24 * 7;
            case "1MO": return 60 * 24 * 30;
            default: return 60 * 24; 
        }
    }

    private boolean isMinuteTimeframe(String timeframe) {
        return timeframe.equals("1M") || timeframe.equals("5M") || timeframe.equals("15M") || timeframe.equals("1H");
    }

    private List<CandleData> getMinuteDataFromDB(String stockCode, String timeframe, int limit) {
        try {

            StockMinutePrice.MinuteInterval interval = convertToMinuteInterval(timeframe);
            log.info("🔍 분봉 데이터 조회 요청: 종목={}, 시간봉={}, 간격={}, 제한={}", stockCode, timeframe, interval, limit);
            
            List<StockMinutePrice> minutePrices = stockMinutePriceService.getRecentMinutePrices(stockCode, interval, limit);
            log.info("📊 분봉 데이터 조회 결과: 종목={}, 시간봉={}, 조회된 데이터={}개", stockCode, timeframe, minutePrices.size());
            
            if (!minutePrices.isEmpty()) {
                log.info("📊 첫 번째 데이터: 시간={}, 간격={}", minutePrices.get(0).getTimestamp(), minutePrices.get(0).getMinuteInterval());
                log.info("📊 마지막 데이터: 시간={}, 간격={}", minutePrices.get(minutePrices.size()-1).getTimestamp(), minutePrices.get(minutePrices.size()-1).getMinuteInterval());
            }
            
            return minutePrices.stream()
                    .map(this::convertToCandleData)
                    .toList();
        } catch (Exception e) {
            log.warn("DB에서 분봉 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
            return new ArrayList<>();
        }
    }

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

    private CandleData convertToCandleData(StockMinutePrice minutePrice) {
        return CandleData.builder()
                .stockCode(minutePrice.getStockSymbol())
                .dateTime(minutePrice.getTimestamp())
                .timeframe(convertMinuteIntervalToTimeframe(minutePrice.getMinuteInterval()))
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

    private StockMinutePrice.MinuteInterval convertToMinuteInterval(String timeframe) {
        switch (timeframe) {
            case "1M": return StockMinutePrice.MinuteInterval.ONE_MINUTE;
            case "5M": return StockMinutePrice.MinuteInterval.FIVE_MINUTES;
            case "15M": return StockMinutePrice.MinuteInterval.FIFTEEN_MINUTES;
            default: return StockMinutePrice.MinuteInterval.FIVE_MINUTES;
        }
    }

    private String convertMinuteIntervalToTimeframe(StockMinutePrice.MinuteInterval interval) {
        switch (interval) {
            case ONE_MINUTE: return "1M";
            case FIVE_MINUTES: return "5M";
            case FIFTEEN_MINUTES: return "15M";
            default: return "5M";
        }
    }

    private List<CandleData> getDailyWeeklyMonthlyDataFromDB(String stockCode, String timeframe, int limit) {
        try {
            log.info("DB에서 일/주/월봉 데이터 조회 시도: 종목={}, 시간봉={}, 제한={}", stockCode, timeframe, limit);

            switch (timeframe) {
                case "1D":
                    return getDailyDataFromDB(stockCode, limit);
                case "1W":
                    return getWeeklyDataFromDB(stockCode, limit);
                case "1MO":
                    return getMonthlyDataFromDB(stockCode, limit);
                default:
                    return new ArrayList<>();
            }
        } catch (Exception e) {
            log.error("DB에서 일/주/월봉 데이터 조회 실패: 종목={}, 시간봉={}", stockCode, timeframe, e);
            return new ArrayList<>();
        }
    }

    private List<CandleData> getDailyDataFromDB(String stockCode, int limit) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(Math.min(limit, 3650)); 

        List<StockDailyPrice> dailyPrices = dailyPriceRepository
                .findByStockSymbolAndTradeDateBetweenOrderByTradeDateAsc(stockCode, startDate, endDate);

        return dailyPrices.stream()
                .limit(limit)
                .map(this::convertDailyToCandleData)
                .collect(java.util.stream.Collectors.toList());
    }

    private List<CandleData> getWeeklyDataFromDB(String stockCode, int limit) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusWeeks(Math.min(limit, 520)); 

        List<StockWeeklyPrice> weeklyPrices = weeklyPriceRepository
                .findByStockSymbolAndWeekStartDateBetweenOrderByWeekStartDateAsc(stockCode, startDate, endDate);

        return weeklyPrices.stream()
                .limit(limit)
                .map(this::convertWeeklyToCandleData)
                .collect(java.util.stream.Collectors.toList());
    }

    private List<CandleData> getMonthlyDataFromDB(String stockCode, int limit) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(Math.min(limit, 120)); 

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        String startMonth = startDate.format(formatter);
        String endMonth = endDate.format(formatter);

        List<StockMonthlyPrice> monthlyPrices = monthlyPriceRepository
                .findByStockSymbolAndYearMonthBetweenOrderByYearMonthAsc(stockCode, startMonth, endMonth);

        return monthlyPrices.stream()
                .limit(limit)
                .map(this::convertMonthlyToCandleData)
                .collect(java.util.stream.Collectors.toList());
    }

    private CandleData convertDailyToCandleData(StockDailyPrice dailyPrice) {
        LocalDateTime dateTime = dailyPrice.getTradeDate().atStartOfDay();
        return CandleData.builder()
                .stockCode(dailyPrice.getStockSymbol())
                .dateTime(dateTime)
                .timeframe("1D")
                .timestamp(dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .openPrice(String.valueOf(dailyPrice.getOpenPrice()))
                .highPrice(String.valueOf(dailyPrice.getHighPrice()))
                .lowPrice(String.valueOf(dailyPrice.getLowPrice()))
                .closePrice(String.valueOf(dailyPrice.getClosePrice()))
                .volume(String.valueOf(dailyPrice.getVolume()))
                .changePrice(String.valueOf(dailyPrice.getPriceChange()))
                .changeRate(String.valueOf(dailyPrice.getPriceChangePercent()))
                .changeSign(calculateChangeSign(String.valueOf(dailyPrice.getPriceChange())))
                .isComplete(true)
                .build();
    }

    private CandleData convertWeeklyToCandleData(StockWeeklyPrice weeklyPrice) {
        LocalDateTime dateTime = weeklyPrice.getWeekStartDate().atStartOfDay();
        return CandleData.builder()
                .stockCode(weeklyPrice.getStockSymbol())
                .dateTime(dateTime)
                .timeframe("1W")
                .timestamp(dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .openPrice(String.valueOf(weeklyPrice.getOpenPrice()))
                .highPrice(String.valueOf(weeklyPrice.getHighPrice()))
                .lowPrice(String.valueOf(weeklyPrice.getLowPrice()))
                .closePrice(String.valueOf(weeklyPrice.getClosePrice()))
                .volume(String.valueOf(weeklyPrice.getVolume()))
                .changePrice(String.valueOf(weeklyPrice.getPriceChange()))
                .changeRate(String.valueOf(weeklyPrice.getPriceChangePercent()))
                .changeSign(calculateChangeSign(String.valueOf(weeklyPrice.getPriceChange())))
                .isComplete(true)
                .build();
    }

    private CandleData convertMonthlyToCandleData(StockMonthlyPrice monthlyPrice) {

        LocalDate date = LocalDate.parse(monthlyPrice.getYearMonth() + "-01");
        LocalDateTime dateTime = date.atStartOfDay();

        return CandleData.builder()
                .stockCode(monthlyPrice.getStockSymbol())
                .dateTime(dateTime)
                .timeframe("1MO")
                .timestamp(dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli())
                .openPrice(String.valueOf(monthlyPrice.getOpenPrice()))
                .highPrice(String.valueOf(monthlyPrice.getHighPrice()))
                .lowPrice(String.valueOf(monthlyPrice.getLowPrice()))
                .closePrice(String.valueOf(monthlyPrice.getClosePrice()))
                .volume(String.valueOf(monthlyPrice.getVolume()))
                .changePrice(String.valueOf(monthlyPrice.getPriceChange()))
                .changeRate(String.valueOf(monthlyPrice.getPriceChangePercent()))
                .changeSign(calculateChangeSign(String.valueOf(monthlyPrice.getPriceChange())))
                .isComplete(true)
                .build();
    }
}
