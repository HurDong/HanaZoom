package com.hanazoom.domain.portfolio.entity;

public enum RebalancingType {
    MANUAL("수동"),
    AUTOMATIC("자동"),
    SCHEDULED("예약");

    private final String description;

    RebalancingType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
