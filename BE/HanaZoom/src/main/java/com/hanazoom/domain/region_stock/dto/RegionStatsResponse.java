package com.hanazoom.domain.region_stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionStatsResponse {
    private Long regionId;
    private String name;
    private Stats stats;
    private List<TrendingStock> trendingStocks;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private int todayPostCount; 
        private int todayCommentCount; 
        private int todayTotalViews; 
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendingStock {
        private String symbol; 
        private String name; 
        private int regionalRanking; 
        private BigDecimal popularityScore; 
        private BigDecimal trendScore; 
    }
}