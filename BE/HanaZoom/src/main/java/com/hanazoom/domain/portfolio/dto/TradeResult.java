package com.hanazoom.domain.portfolio.dto;

import com.hanazoom.domain.portfolio.entity.TradeHistory;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TradeResult {

    private boolean success;
    private String message;
    private TradeHistory tradeHistory;
    private String errorCode;

    public static TradeResult success(String message) {
        return TradeResult.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static TradeResult success(String message, TradeHistory tradeHistory) {
        return TradeResult.builder()
                .success(true)
                .message(message)
                .tradeHistory(tradeHistory)
                .build();
    }

    public static TradeResult error(String message) {
        return TradeResult.builder()
                .success(false)
                .message(message)
                .build();
    }

    public static TradeResult error(String message, String errorCode) {
        return TradeResult.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}
