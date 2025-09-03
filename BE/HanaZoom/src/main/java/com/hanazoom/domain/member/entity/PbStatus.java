package com.hanazoom.domain.member.entity;

public enum PbStatus {
    INACTIVE, // 비활성 (일반회원)
    PENDING, // 승인 대기
    ACTIVE, // 활성 (PB)
    SUSPENDED, // 정지
    REJECTED // 거부
}
