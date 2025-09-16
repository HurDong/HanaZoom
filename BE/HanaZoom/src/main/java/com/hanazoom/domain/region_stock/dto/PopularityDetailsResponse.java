package com.hanazoom.domain.region_stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopularityDetailsResponse {

    private Long regionId;
    private String symbol;
    private LocalDate date;

    // 최종 점수 및 구성요소 점수(0~1 스케일)
    private BigDecimal score;            // 0~100 스케일
    private BigDecimal tradeTrend;       // 0~1
    private BigDecimal community;        // 0~1
    private BigDecimal momentum;         // 0~1
    private BigDecimal newsImpact;       // 0~1 (현재 미구현, 0 고정)

    // 구성요소 가중치(합산 사용)
    private BigDecimal weightTradeTrend; // 예: 0.45
    private BigDecimal weightCommunity;  // 예: 0.35
    private BigDecimal weightMomentum;   // 예: 0.20
    private BigDecimal weightNews;       // 예: 0.10 (미구현 시 0 또는 소량)

    // 커뮤니티 원시 지표(전일)
    private int postCount;
    private int commentCount;
    private int voteCount;
    private int viewCount;

}


