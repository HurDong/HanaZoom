package com.hanazoom.domain.portfolio.entity;

public enum AlertType {
    PRICE("가격"),
    PROFIT_LOSS("손익"),
    QUANTITY("수량"),
    ALLOCATION("자산 배분");

    private final String description;

    AlertType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
