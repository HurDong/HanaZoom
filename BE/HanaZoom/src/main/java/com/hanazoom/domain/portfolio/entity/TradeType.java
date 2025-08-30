package com.hanazoom.domain.portfolio.entity;

public enum TradeType {
    BUY("매수"),
    SELL("매도"),
    DIVIDEND("배당"),
    SPLIT("분할"),
    MERGE("합병");

    private final String description;

    TradeType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
