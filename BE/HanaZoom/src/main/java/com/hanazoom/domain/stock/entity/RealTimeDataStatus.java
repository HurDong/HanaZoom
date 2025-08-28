package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "real_time_data_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class RealTimeDataStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stock_symbol", nullable = false, length = 20)
    private String stockSymbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false)
    private DataType dataType;

    @Column(name = "last_update_time")
    private LocalDateTime lastUpdateTime;

    @Column(name = "is_connected")
    private Boolean isConnected = false;

    @Column(name = "connection_status", length = 50)
    private String connectionStatus;

    @Column(name = "error_count")
    private Integer errorCount = 0;

    @Column(name = "last_error_message", length = 1000)
    private String lastErrorMessage;

    @Column(name = "data_frequency_seconds")
    private Integer dataFrequencySeconds;

    @Column(name = "expected_update_time")
    private LocalDateTime expectedUpdateTime;

    @Column(name = "is_delayed")
    private Boolean isDelayed = false;

    @Column(name = "delay_seconds")
    private Integer delaySeconds = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum DataType {
        TICK_DATA("틱 데이터"),
        ONE_MINUTE("1분봉"),
        FIVE_MINUTES("5분봉"),
        FIFTEEN_MINUTES("15분봉");

        private final String description;

        DataType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
