package com.hanazoom.domain.community.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PostType {
    TEXT, 
    POLL; 

    @JsonCreator
    public static PostType fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return PostType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid PostType value: " + value + ". Must be one of: TEXT, POLL");
        }
    }

    @JsonValue
    public String getValue() {
        return this.name();
    }
}