package com.hanazoom.domain.consultation.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PbTimeStatusDto {
    private List<String> unavailableTimes; // PB가 등록한 불가능 시간
    private List<ClientBooking> clientBookings; // 고객이 예약한 시간

    @Getter
    @Builder
    public static class ClientBooking {
        private String time; // 예약 시간 (HH:mm 형식)
        private String clientName; // 고객명
        private String status; // 예약 상태
        private Integer durationMinutes; // 상담 시간 (분)
        private String consultationType; // 상담 유형
    }
}
