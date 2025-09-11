package com.hanazoom.domain.consultation.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ConsultationJoinResponse {
    private boolean success;
    private String consultationId;
    private Map<String, Object> participants;
    private String message;
    private String error;
}
