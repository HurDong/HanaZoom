package com.hanazoom.domain.consultation.dto;

import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import com.hanazoom.domain.consultation.entity.ConsultationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationSummaryDto {

    private UUID id;
    private String clientName;
    private String pbName;
    private ConsultationType consultationType;
    private ConsultationStatus status;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private BigDecimal fee;
    private String clientMessage;
    private boolean isCancelled;
    private LocalDateTime createdAt;


    private String statusDisplayName;
    private String typeDisplayName;
    private boolean canBeCancelled;
    private boolean canBeStarted;
    private boolean canBeEnded;
}
