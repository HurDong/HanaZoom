package com.hanazoom.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockTickerDto {
    private String symbol;
    private String name;
    private String price;
    private String change;
    private String logoUrl;
    private String sector;
    
    // 프론트엔드에서 기대하는 필드명들 추가
    private String stockCode;
    private String stockName;
    private String currentPrice;
    private String priceChange;
    private String changeRate;
}