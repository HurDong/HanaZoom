package com.hanazoom.domain.consultation.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "consultations")
public class Consultation {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Member client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pb_id", nullable = false)
    private Member pb;

    @Enumerated(EnumType.ORDINAL) 
    @Column(name = "consultation_type", nullable = false)
    private ConsultationType consultationType;

    @Enumerated(EnumType.ORDINAL) 
    @Column(name = "status", nullable = false)
    private ConsultationStatus status = ConsultationStatus.PENDING;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 60;

    @Column(name = "fee", precision = 10, scale = 2)
    private BigDecimal fee;

    @Column(name = "client_message", columnDefinition = "TEXT")
    private String clientMessage;

    @Column(name = "pb_message", columnDefinition = "TEXT")
    private String pbMessage;

    @Column(name = "consultation_notes", columnDefinition = "TEXT")
    private String consultationNotes;

    @Column(name = "meeting_url")
    private String meetingUrl;

    @Column(name = "meeting_id")
    private String meetingId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "client_rating")
    private Integer clientRating;

    @Column(name = "client_feedback", columnDefinition = "TEXT")
    private String clientFeedback;

    @Column(name = "is_cancelled")
    private boolean isCancelled = false;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by")
    @Enumerated(EnumType.ORDINAL) 
    private CancelledBy cancelledBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Consultation(Member client, Member pb, ConsultationType consultationType,
            LocalDateTime scheduledAt, Integer durationMinutes, BigDecimal fee,
            String clientMessage, ConsultationStatus status) {
        this.client = client;
        this.pb = pb;
        this.consultationType = consultationType;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 30; 
        this.fee = fee;
        this.clientMessage = clientMessage;
        this.status = status != null ? status : ConsultationStatus.PENDING;
    }


    @Deprecated
    public void bookByClient(Member client, ConsultationType consultationType, String clientMessage, BigDecimal fee) {
        if (this.status != ConsultationStatus.AVAILABLE) {
            throw new IllegalStateException("예약 가능한 상태가 아닙니다.");
        }
        this.client = client;
        this.consultationType = consultationType;
        this.clientMessage = clientMessage;
        this.fee = fee;
        this.status = ConsultationStatus.PENDING;
    }


    public void approve(String pbMessage) {
        this.status = ConsultationStatus.APPROVED;
        this.pbMessage = pbMessage;
    }


    public void reject(String pbMessage) {
        this.status = ConsultationStatus.REJECTED;
        this.pbMessage = pbMessage;
    }


    public void start(String meetingUrl, String meetingId) {
        this.status = ConsultationStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
        this.meetingUrl = meetingUrl;
        this.meetingId = meetingId;
    }


    public void end(String consultationNotes) {
        this.status = ConsultationStatus.COMPLETED;
        this.endedAt = LocalDateTime.now();
        this.consultationNotes = consultationNotes;
    }


    public void cancel(String reason, CancelledBy cancelledBy) {
        this.isCancelled = true;
        this.cancellationReason = reason;
        this.cancelledAt = LocalDateTime.now();
        this.cancelledBy = cancelledBy;
        this.status = ConsultationStatus.CANCELLED;
    }


    public void rateByClient(Integer rating, String feedback) {
        this.clientRating = rating;
        this.clientFeedback = feedback;
    }


    public void updateSchedule(LocalDateTime newScheduledAt, Integer newDurationMinutes) {
        this.scheduledAt = newScheduledAt;
        this.durationMinutes = newDurationMinutes;
    }


    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }


    public boolean isPending() {
        return this.status == ConsultationStatus.PENDING;
    }

    public boolean isApproved() {
        return this.status == ConsultationStatus.APPROVED;
    }

    public boolean isInProgress() {
        return this.status == ConsultationStatus.IN_PROGRESS;
    }

    public boolean isCompleted() {
        return this.status == ConsultationStatus.COMPLETED;
    }

    public boolean isCancelled() {
        return this.isCancelled || this.status == ConsultationStatus.CANCELLED;
    }

    public boolean isRejected() {
        return this.status == ConsultationStatus.REJECTED;
    }


    public long getActualDurationMinutes() {
        if (startedAt != null && endedAt != null) {
            return java.time.Duration.between(startedAt, endedAt).toMinutes();
        }
        return 0;
    }


    public boolean canBeCancelled() {
        return !isCancelled() && !isCompleted() && !isInProgress();
    }

    public boolean canBeStarted() {

        return (isApproved() || isPending()) && !isCancelled() && !isCompleted();
    }

    public boolean canBeEnded() {
        return isInProgress();
    }


    public void approve() {
        if (this.status != ConsultationStatus.PENDING) {
            throw new IllegalStateException("승인할 수 없는 상태입니다. 현재 상태: " + this.status);
        }
        this.status = ConsultationStatus.APPROVED;
        this.updatedAt = LocalDateTime.now();
    }


    public boolean isPbOwnSchedule() {
        return this.client != null && this.pb != null &&
                this.client.getId().equals(this.pb.getId());
    }


    public boolean isClientBooking() {
        return !isPbOwnSchedule();
    }
}
