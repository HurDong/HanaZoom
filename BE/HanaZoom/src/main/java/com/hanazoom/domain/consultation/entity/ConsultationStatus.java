package com.hanazoom.domain.consultation.entity;

public enum ConsultationStatus {
    AVAILABLE("예약 가능"),
    UNAVAILABLE("예약 불가능"),
    PENDING("대기중"),
    APPROVED("승인됨"),
    REJECTED("거절됨"),
    IN_PROGRESS("진행중"),
    COMPLETED("완료됨"),
    CANCELLED("취소됨");

    private final String displayName;

    ConsultationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
