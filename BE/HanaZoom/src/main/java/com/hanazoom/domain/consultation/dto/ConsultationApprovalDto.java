package com.hanazoom.domain.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationApprovalDto {

    @NotNull(message = "상담 ID는 필수입니다")
    private String consultationId;

    @NotNull(message = "승인 여부는 필수입니다")
    private boolean approved;

    @NotBlank(message = "PB 메시지는 필수입니다")
    private String pbMessage;

    private String meetingUrl;
    private String meetingId;
}
