package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Elasticsearch 검색 결과 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockSearchResult {

    /**
     * 주식 심볼/코드
     */
    private String symbol;

    /**
     * 종목명
     */
    private String name;

    /**
     * 업종/섹터
     */
    private String sector;

    /**
     * 현재가
     */
    private String currentPrice;

    /**
     * 등락률
     */
    private String priceChangePercent;

    /**
     * 로고 URL
     */
    private String logoUrl;

    /**
     * 검색 점수 (관련도)
     */
    private Float score;

    /**
     * 검색 타입 (EXACT, FUZZY, NGRAM 등)
     */
    private String matchType;

    /**
     * 하이라이트된 텍스트 (옵션)
     */
    private String highlightedName;

    // 프론트엔드 호환성을 위한 필드
    private String stockCode;
    private String stockName;
    private String price;
    private String change;
    private String changeRate;

    /**
     * 프론트엔드 호환성을 위한 setter
     */
    public void setCompatibilityFields() {
        this.stockCode = this.symbol;
        this.stockName = this.name;
        this.price = this.currentPrice;
        this.change = this.priceChangePercent;
        this.changeRate = this.priceChangePercent;
    }
}
