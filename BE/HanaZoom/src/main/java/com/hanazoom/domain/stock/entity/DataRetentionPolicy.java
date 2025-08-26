package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_retention_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class DataRetentionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, unique = true)
    private DataType dataType;

    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "last_cleanup_date")
    private LocalDateTime lastCleanupDate;

    @Column(name = "cleanup_batch_size")
    private Integer cleanupBatchSize = 10000;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum DataType {
        TICK_DATA("틱 데이터", 30), // 30일 보관
        ONE_MINUTE("1분봉", 90), // 90일 보관
        FIVE_MINUTES("5분봉", 180), // 180일 보관
        FIFTEEN_MINUTES("15분봉", 365), // 1년 보관
        DAILY("일봉", 2555), // 7년 보관
        WEEKLY("주봉", 3650), // 10년 보관
        MONTHLY("월봉", 10950); // 30년 보관

        private final String description;
        private final int defaultRetentionDays;

        DataType(String description, int defaultRetentionDays) {
            this.description = description;
            this.defaultRetentionDays = defaultRetentionDays;
        }

        public String getDescription() {
            return description;
        }

        public int getDefaultRetentionDays() {
            return defaultRetentionDays;
        }
    }
}
