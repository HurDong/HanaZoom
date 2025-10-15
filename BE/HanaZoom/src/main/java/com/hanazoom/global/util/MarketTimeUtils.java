package com.hanazoom.global.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Set;

@Slf4j
@Component
public class MarketTimeUtils {


    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");


    private static final LocalTime MARKET_OPEN = LocalTime.of(9, 0);
    private static final LocalTime MARKET_CLOSE = LocalTime.of(15, 30);


    private static final LocalTime PRE_MARKET_OPEN = LocalTime.of(8, 30);


    private static final LocalTime POST_MARKET_OPEN = LocalTime.of(15, 40);
    private static final LocalTime POST_MARKET_CLOSE = LocalTime.of(16, 0);


    private static final Set<String> FIXED_HOLIDAYS = Set.of(
            "01-01", 
            "03-01", 
            "05-05", 
            "06-06", 
            "08-15", 
            "10-03", 
            "10-09", 
            "12-25" 
    );

    public LocalDateTime getCurrentKoreanTime() {
        return LocalDateTime.now(KOREA_ZONE);
    }

    public MarketStatus getMarketStatus() {
        LocalDateTime now = getCurrentKoreanTime();
        LocalTime currentTime = now.toLocalTime();


        if (isWeekend(now)) {
            return MarketStatus.CLOSED_WEEKEND;
        }


        if (isPublicHoliday(now)) {
            return MarketStatus.CLOSED_HOLIDAY;
        }


        if (currentTime.compareTo(MARKET_OPEN) >= 0 && currentTime.compareTo(MARKET_CLOSE) <= 0) {
            return MarketStatus.OPEN;
        }


        if (currentTime.compareTo(PRE_MARKET_OPEN) >= 0 && currentTime.compareTo(MARKET_OPEN) < 0) {
            return MarketStatus.PRE_MARKET;
        }


        if (currentTime.compareTo(POST_MARKET_OPEN) >= 0 && currentTime.compareTo(POST_MARKET_CLOSE) <= 0) {
            return MarketStatus.POST_MARKET;
        }

        return MarketStatus.CLOSED;
    }

    public boolean isMarketOpen() {
        return getMarketStatus() == MarketStatus.OPEN;
    }

    public boolean isMarketClosed() {
        MarketStatus status = getMarketStatus();
        return status == MarketStatus.CLOSED ||
                status == MarketStatus.CLOSED_WEEKEND ||
                status == MarketStatus.CLOSED_HOLIDAY;
    }

    public boolean isPostMarketHours() {
        return getMarketStatus() == MarketStatus.POST_MARKET;
    }

    public LocalDate getNextTradingDay() {
        LocalDate date = getCurrentKoreanTime().toLocalDate().plusDays(1);

        while (isWeekend(date.atStartOfDay()) || isPublicHoliday(date.atStartOfDay())) {
            date = date.plusDays(1);
        }

        return date;
    }

    public LocalDate getLastTradingDay() {
        LocalDate date = getCurrentKoreanTime().toLocalDate();


        if (isMarketOpen()) {
            return date;
        }


        date = date.minusDays(1);
        while (isWeekend(date.atStartOfDay()) || isPublicHoliday(date.atStartOfDay())) {
            date = date.minusDays(1);
        }

        return date;
    }

    public MarketTimeInfo getMarketTimeInfo() {
        LocalDateTime now = getCurrentKoreanTime();
        MarketStatus status = getMarketStatus();

        return MarketTimeInfo.builder()
                .currentTime(now)
                .marketStatus(status)
                .isMarketOpen(status == MarketStatus.OPEN)
                .isMarketClosed(isMarketClosed())
                .nextTradingDay(getNextTradingDay())
                .lastTradingDay(getLastTradingDay())
                .statusMessage(getStatusMessage(status))
                .build();
    }

    private boolean isWeekend(LocalDateTime dateTime) {
        DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
    }

    private boolean isPublicHoliday(LocalDateTime dateTime) {
        String monthDay = dateTime.format(DateTimeFormatter.ofPattern("MM-dd"));
        return FIXED_HOLIDAYS.contains(monthDay);
    }

    private String getStatusMessage(MarketStatus status) {
        switch (status) {
            case OPEN:
                return "정규 거래시간";
            case PRE_MARKET:
                return "장전 시간";
            case POST_MARKET:
                return "장후 시간";
            case CLOSED:
                return "거래시간 종료";
            case CLOSED_WEEKEND:
                return "주말";
            case CLOSED_HOLIDAY:
                return "공휴일";
            default:
                return "알 수 없음";
        }
    }

    public enum MarketStatus {
        OPEN, 
        PRE_MARKET, 
        POST_MARKET, 
        CLOSED, 
        CLOSED_WEEKEND, 
        CLOSED_HOLIDAY 
    }

    @lombok.Builder
    @lombok.Data
    public static class MarketTimeInfo {
        private LocalDateTime currentTime;
        private MarketStatus marketStatus;
        private boolean isMarketOpen;
        private boolean isMarketClosed;
        private LocalDate nextTradingDay;
        private LocalDate lastTradingDay;
        private String statusMessage;
    }
}

