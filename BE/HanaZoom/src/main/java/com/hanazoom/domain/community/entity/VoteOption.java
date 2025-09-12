package com.hanazoom.domain.community.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum VoteOption {
    UP, DOWN;

    @JsonCreator
    public static VoteOption fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return VoteOption.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid VoteOption value: " + value + ". Must be one of: UP, DOWN");
        }
    }

    @JsonValue
    public String getValue() {
        return this.name();
    }
}