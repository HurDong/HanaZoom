package com.hanazoom.global.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Set;

/**
 * 주식시장 운영시간 관련 유틸리티
 */
@Slf4j
@Component
public class MarketTimeUtils {

    // 한국 시간대
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

    // 정규 거래시간 (09:00 ~ 15:30)
    private static final LocalTime MARKET_OPEN = LocalTime.of(9, 0);
    private static final LocalTime MARKET_CLOSE = LocalTime.of(15, 30);

    // 장전 시간 (08:30 ~ 09:00)
    private static final LocalTime PRE_MARKET_OPEN = LocalTime.of(8, 30);

    // 장후 시간 (15:40 ~ 16:00)
    private static final LocalTime POST_MARKET_OPEN = LocalTime.of(15, 40);
    private static final LocalTime POST_MARKET_CLOSE = LocalTime.of(16, 0);

    // 고정 휴일 (월-일 형식)
    private static final Set<String> FIXED_HOLIDAYS = Set.of(
            "01-01", // 신정
            "03-01", // 삼일절
            "05-05", // 어린이날
            "06-06", // 현충일
            "08-15", // 광복절
            "10-03", // 개천절
            "10-09", // 한글날
            "12-25" // 크리스마스
    );

    /**
     * 현재 한국시간 반환
     */
    public LocalDateTime getCurrentKoreanTime() {
        return LocalDateTime.now(KOREA_ZONE);
    }

    /**
     * 현재 시장 운영 상태 반환
     */
    public MarketStatus getMarketStatus() {
        LocalDateTime now = getCurrentKoreanTime();
        LocalTime currentTime = now.toLocalTime();

        // 주말 체크
        if (isWeekend(now)) {
            return MarketStatus.CLOSED_WEEKEND;
        }

        // 공휴일 체크
        if (isPublicHoliday(now)) {
            return MarketStatus.CLOSED_HOLIDAY;
        }

        // 정규 거래시간 (09:00 ~ 15:30)
        if (currentTime.compareTo(MARKET_OPEN) >= 0 && currentTime.compareTo(MARKET_CLOSE) <= 0) {
            return MarketStatus.OPEN;
        }

        // 장전 시간 (08:30 ~ 09:00)
        if (currentTime.compareTo(PRE_MARKET_OPEN) >= 0 && currentTime.compareTo(MARKET_OPEN) < 0) {
            return MarketStatus.PRE_MARKET;
        }

        // 장후 시간 (15:40 ~ 16:00)
        if (currentTime.compareTo(POST_MARKET_OPEN) >= 0 && currentTime.compareTo(POST_MARKET_CLOSE) <= 0) {
            return MarketStatus.POST_MARKET;
        }

        return MarketStatus.CLOSED;
    }

    /**
     * 현재 정규 거래시간 여부
     */
    public boolean isMarketOpen() {
        return getMarketStatus() == MarketStatus.OPEN;
    }

    /**
     * 현재 거래시간 종료 여부 (정규시간 + 장후시간 포함)
     */
    public boolean isMarketClosed() {
        MarketStatus status = getMarketStatus();
        return status == MarketStatus.CLOSED ||
                status == MarketStatus.CLOSED_WEEKEND ||
                status == MarketStatus.CLOSED_HOLIDAY;
    }

    /**
     * 현재 장후시간 여부
     */
    public boolean isPostMarketHours() {
        return getMarketStatus() == MarketStatus.POST_MARKET;
    }

    /**
     * 다음 거래일 반환
     */
    public LocalDate getNextTradingDay() {
        LocalDate date = getCurrentKoreanTime().toLocalDate().plusDays(1);

        while (isWeekend(date.atStartOfDay()) || isPublicHoliday(date.atStartOfDay())) {
            date = date.plusDays(1);
        }

        return date;
    }

    /**
     * 마지막 거래일 반환
     */
    public LocalDate getLastTradingDay() {
        LocalDate date = getCurrentKoreanTime().toLocalDate();

        // 현재 거래시간이면 오늘이 거래일
        if (isMarketOpen()) {
            return date;
        }

        // 아니면 이전 거래일 찾기
        date = date.minusDays(1);
        while (isWeekend(date.atStartOfDay()) || isPublicHoliday(date.atStartOfDay())) {
            date = date.minusDays(1);
        }

        return date;
    }

    /**
     * 거래시간 관련 정보 반환
     */
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

    /**
     * 주말 여부 확인
     */
    private boolean isWeekend(LocalDateTime dateTime) {
        DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
    }

    /**
     * 공휴일 여부 확인 (간단한 고정 공휴일만 체크)
     */
    private boolean isPublicHoliday(LocalDateTime dateTime) {
        String monthDay = dateTime.format(DateTimeFormatter.ofPattern("MM-dd"));
        return FIXED_HOLIDAYS.contains(monthDay);
        // TODO: 음력 공휴일 (설날, 추석 등) 계산 로직 추가 가능
    }

    /**
     * 상태 메시지 반환
     */
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

    /**
     * 시장 운영 상태 enum
     */
    public enum MarketStatus {
        OPEN, // 정규 거래시간
        PRE_MARKET, // 장전
        POST_MARKET, // 장후
        CLOSED, // 거래시간 종료
        CLOSED_WEEKEND, // 주말
        CLOSED_HOLIDAY // 공휴일
    }

    /**
     * 시장 시간 정보 DTO
     */
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

