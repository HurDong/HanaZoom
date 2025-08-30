package com.hanazoom.domain.portfolio.entity;

public enum AccountType {
    STOCK("주식"),
    FUND("펀드"),
    MIXED("혼합");

    private final String description;

    AccountType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
