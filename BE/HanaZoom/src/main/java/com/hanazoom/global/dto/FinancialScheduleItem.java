package com.hanazoom.global.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FinancialScheduleItem {
    private final String indicator;     // 지표명
    private final String time;          // 발표 시간
    private final String date;          // 발표 날짜
    private final String dayOfWeek;     // 요일
    private final String importance;    // 중요도
    private final String country;       // 국가
    private final String forecast;      // 예측치
    private final String previous;      // 이전 값 (선택사항)

    // JSON 직렬화를 위한 기본 생성자
    public FinancialScheduleItem() {
        this.indicator = null;
        this.time = null;
        this.date = null;
        this.dayOfWeek = null;
        this.importance = null;
        this.country = null;
        this.forecast = null;
        this.previous = null;
    }

    public FinancialScheduleItem(String indicator, String time, String date, String dayOfWeek,
                                String importance, String country, String forecast, String previous) {
        this.indicator = indicator;
        this.time = time;
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.importance = importance;
        this.country = country;
        this.forecast = forecast;
        this.previous = previous;
    }

    public FinancialScheduleItem(String indicator, String time, String date, String dayOfWeek,
                                String importance, String country, String forecast) {
        this(indicator, time, date, dayOfWeek, importance, country, forecast, null);
    }
}
