package com.hanazoom.domain.consultation.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PbTimeStatusDto {
    private List<String> unavailableTimes; 
    private List<ClientBooking> clientBookings; 

    @Getter
    @Builder
    public static class ClientBooking {
        private String time; 
        private String clientName; 
        private String status; 
        private Integer durationMinutes; 
        private String consultationType; 
    }
}
