package com.hanazoom.domain.community.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PostSentiment {
    BULLISH, // 상승 전망
    BEARISH, // 하락 전망
    NEUTRAL; // 중립

    @JsonCreator
    public static PostSentiment fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return PostSentiment.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid PostSentiment value: " + value + ". Must be one of: BULLISH, BEARISH, NEUTRAL");
        }
    }

    @JsonValue
    public String getValue() {
        return this.name();
    }
}