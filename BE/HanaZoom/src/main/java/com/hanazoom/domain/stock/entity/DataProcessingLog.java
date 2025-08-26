package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_processing_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class DataProcessingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "process_type", nullable = false)
    private ProcessType processType;

    @Column(name = "stock_symbol", length = 20)
    private String stockSymbol;

    @Column(name = "records_processed")
    private Integer recordsProcessed = 0;

    @Column(name = "records_inserted")
    private Integer recordsInserted = 0;

    @Column(name = "records_updated")
    private Integer recordsUpdated = 0;

    @Column(name = "records_failed")
    private Integer recordsFailed = 0;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "processing_duration_seconds")
    private Integer processingDurationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ProcessStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ProcessType {
        DAILY, WEEKLY, MONTHLY, ALL
    }

    public enum ProcessStatus {
        SUCCESS, PARTIAL_SUCCESS, FAILED
    }
}
