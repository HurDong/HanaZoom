package com.hanazoom.domain.stock.dto;

import com.hanazoom.domain.stock.entity.Stock;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class StockResponse {
    private String symbol;
    private String name;
    private String market;
    private String sector;
    private String logoUrl;
    private BigDecimal currentPrice;
    private BigDecimal priceChange;
    private BigDecimal priceChangePercent;
    private Long volume;
    private Long marketCap;

    public static StockResponse from(Stock stock) {
        return StockResponse.builder()
                .symbol(stock.getSymbol())
                .name(stock.getName())
                .market(stock.getMarket())
                .sector(stock.getSector())
                .logoUrl(stock.getLogoUrl())
                .currentPrice(stock.getCurrentPrice())
                .priceChange(stock.getPriceChange())
                .priceChangePercent(stock.getPriceChangePercent())
                .volume(stock.getVolume())
                .marketCap(stock.getMarketCap())
                .build();
    }
}