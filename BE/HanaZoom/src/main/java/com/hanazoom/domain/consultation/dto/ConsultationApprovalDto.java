package com.hanazoom.domain.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationApprovalDto {

    private String consultationId;

    private boolean approved;

    private String pbMessage;

    private String meetingUrl;
    private String meetingId;
}
