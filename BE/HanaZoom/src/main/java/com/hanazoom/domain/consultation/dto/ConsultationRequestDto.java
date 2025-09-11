package com.hanazoom.domain.consultation.dto;

import com.hanazoom.domain.consultation.entity.ConsultationType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRequestDto {

    @NotNull(message = "PB ID는 필수입니다")
    private String pbId;

    @NotNull(message = "상담 유형은 필수입니다")
    private ConsultationType consultationType;

    @NotNull(message = "예약 시간은 필수입니다")
    @Future(message = "예약 시간은 미래 시간이어야 합니다")
    private LocalDateTime scheduledAt;

    @Min(value = 15, message = "상담 시간은 최소 15분 이상이어야 합니다")
    private Integer durationMinutes;

    private BigDecimal fee;

    @NotBlank(message = "상담 요청 메시지는 필수입니다")
    private String clientMessage;
}
