package com.hanazoom.domain.portfolio.entity;

public enum NotificationMethod {
    EMAIL("이메일"),
    SMS("문자"),
    PUSH("푸시"),
    ALL("모든 방법");

    private final String description;

    NotificationMethod(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
