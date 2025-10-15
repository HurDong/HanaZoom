package com.hanazoom.domain.portfolio.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegionalPortfolioAnalysisDto {
    

    private String regionName;
    

    private UserPortfolioInfo userPortfolio;
    

    private RegionalAverageInfo regionalAverage;
    

    private ComparisonResult comparison;
    

    private int suitabilityScore;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserPortfolioInfo {
        private int stockCount;
        private BigDecimal totalValue;
        private String riskLevel;
        private int diversificationScore;
        private List<StockInfo> topStocks;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegionalAverageInfo {
        private int averageStockCount;
        private BigDecimal averageTotalValue;
        private String commonRiskLevel;
        private int averageDiversificationScore;
        private List<PopularStockInfo> popularStocks;
        private List<InvestmentTrend> investmentTrends;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComparisonResult {
        private int stockCountDifference;
        private boolean riskLevelMatch;
        private int recommendationCount;
        private List<String> recommendations;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockInfo {
        private String symbol;
        private String name;
        private BigDecimal percentage;
        private String sector;
        private String logoUrl;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularStockInfo {
        private String symbol;
        private String name;
        private BigDecimal popularityScore;
        private int ranking;
        private String sector;
        private String logoUrl;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvestmentTrend {
        private String sector;
        private BigDecimal percentage;
        private String trend; 
    }
}
