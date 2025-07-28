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
        private int todayPostCount; // 오늘 작성된 게시글 수
        private int todayCommentCount; // 오늘 작성된 댓글 수
        private int todayTotalViews; // 오늘 총 조회수
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendingStock {
        private String symbol; // 종목 코드
        private String name; // 종목명
        private int regionalRanking; // 지역 내 순위
        private BigDecimal popularityScore; // 인기도 점수
        private BigDecimal trendScore; // 트렌드 점수
    }
}