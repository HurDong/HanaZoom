package com.hanazoom.domain.consultation.dto;

import com.hanazoom.domain.consultation.entity.CancelledBy;
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
public class ConsultationResponseDto {

    private UUID id;
    private String clientId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private String pbId;
    private String pbName;
    private String pbPhone;
    private String pbEmail;
    private ConsultationType consultationType;
    private ConsultationStatus status;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private BigDecimal fee;
    private String clientMessage;
    private String pbMessage;
    private String consultationNotes;
    private String meetingUrl;
    private String meetingId;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer clientRating;
    private String clientFeedback;
    private boolean isCancelled;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private CancelledBy cancelledBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    private long actualDurationMinutes;
    private boolean canBeCancelled;
    private boolean canBeStarted;
    private boolean canBeEnded;
    private boolean canBeRated;
}
