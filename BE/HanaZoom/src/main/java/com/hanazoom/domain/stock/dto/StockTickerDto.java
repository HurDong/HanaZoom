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
    private String emoji;
    private String sector;
}