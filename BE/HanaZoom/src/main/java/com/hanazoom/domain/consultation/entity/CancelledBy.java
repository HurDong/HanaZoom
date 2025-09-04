package com.hanazoom.domain.consultation.entity;

public enum CancelledBy {
    CLIENT("고객"),
    PB("PB"),
    SYSTEM("시스템");

    private final String displayName;

    CancelledBy(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
