package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockSearchResult {

    private String symbol;

    private String name;

    private String sector;

    private String currentPrice;

    private String priceChangePercent;

    private String logoUrl;

    private Float score;

    private String matchType;

    private String highlightedName;


    private String stockCode;
    private String stockName;
    private String price;
    private String change;
    private String changeRate;

    public void setCompatibilityFields() {
        this.stockCode = this.symbol;
        this.stockName = this.name;
        this.price = this.currentPrice;
        this.change = this.priceChangePercent;
        this.changeRate = this.priceChangePercent;
    }
}
