package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_minute_prices", uniqueConstraints = @UniqueConstraint(columnNames = { "stock_symbol",
        "minute_interval", "timestamp" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class StockMinutePrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stock_symbol", nullable = false, length = 20)
    private String stockSymbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "minute_interval", nullable = false)
    private MinuteInterval minuteInterval;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "open_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal openPrice;

    @Column(name = "high_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal highPrice;

    @Column(name = "low_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal lowPrice;

    @Column(name = "close_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal closePrice;

    @Column(name = "volume", nullable = false)
    private Long volume;

    @Column(name = "price_change", precision = 15, scale = 2)
    private BigDecimal priceChange;

    @Column(name = "price_change_percent", precision = 5, scale = 2)
    private BigDecimal priceChangePercent;

    @Column(name = "vwap", precision = 15, scale = 2)
    private BigDecimal vwap;

    @Column(name = "tick_count")
    private Integer tickCount;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum MinuteInterval {
        ONE_MINUTE(1, "1분"),
        FIVE_MINUTES(5, "5분"),
        FIFTEEN_MINUTES(15, "15분");

        private final int minutes;
        private final String description;

        MinuteInterval(int minutes, String description) {
            this.minutes = minutes;
            this.description = description;
        }

        public int getMinutes() {
            return minutes;
        }

        public String getDescription() {
            return description;
        }
    }
}
