package com.hanazoom.domain.consultation.dto;

import lombok.Data;

@Data
public class ConsultationJoinRequest {
    private String consultationId;
    private String clientId;
    private String userId;
}
