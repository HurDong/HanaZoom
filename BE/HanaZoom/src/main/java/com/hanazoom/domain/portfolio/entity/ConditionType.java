package com.hanazoom.domain.portfolio.entity;

public enum ConditionType {
    ABOVE("이상"),
    BELOW("이하"),
    EQUAL("정확히"),
    CHANGE("변화");

    private final String description;

    ConditionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
