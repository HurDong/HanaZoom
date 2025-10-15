package com.hanazoom.global.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FinancialCalendarDto {
    private WeekInfo week;
    private FinancialScheduleItem[] items;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeekInfo {
        @JsonProperty("baseDate")
        private String baseDate;

        private String start;
        private String end;
        private String timezone;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialScheduleItem {
        @JsonProperty("indicatorCode")
        private String indicatorCode;

        @JsonProperty("nameKo")
        private String nameKo;

        @JsonProperty("nameEn")
        private String nameEn;

        private String cycle;
        private String unit;

        @JsonProperty("scheduledDate")
        private String scheduledDate;

        @JsonProperty("publishedAt")
        private String publishedAt;

        @JsonProperty("timeKey")
        private String timeKey;

        private String previous;
        private String actual;
        private String status;
        private String source;
    }
}

