package com.hanazoom.global.exception;

public class BusinessException extends RuntimeException {
    
    private final String errorCode;
    
    public BusinessException(String errorCode) {
        super(getErrorMessage(errorCode));
        this.errorCode = errorCode;
    }
    
    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    private static String getErrorMessage(String errorCode) {
        switch (errorCode) {
            case "ORDER_NOT_FOUND":
                return "주문을 찾을 수 없습니다.";
            case "ACCESS_DENIED":
                return "접근 권한이 없습니다.";
            case "ORDER_CANNOT_CANCEL":
                return "취소할 수 없는 주문입니다.";
            case "INVALID_ORDER_QUANTITY":
                return "유효하지 않은 주문 수량입니다.";
            case "INVALID_ORDER_PRICE":
                return "유효하지 않은 주문 가격입니다.";
            case "INSUFFICIENT_BALANCE":
                return "잔고가 부족합니다.";
            case "INSUFFICIENT_STOCK":
                return "보유 주식이 부족합니다.";
            case "STOCK_NOT_FOUND":
                return "주식을 찾을 수 없습니다.";
            default:
                return "비즈니스 오류가 발생했습니다.";
        }
    }
}



