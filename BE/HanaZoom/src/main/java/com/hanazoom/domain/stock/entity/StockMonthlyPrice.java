package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_monthly_prices", uniqueConstraints = @UniqueConstraint(columnNames = { "stock_symbol",
        "year_month" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class StockMonthlyPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stock_symbol", nullable = false, length = 20)
    private String stockSymbol;

    @Column(name = "year_month_period", nullable = false, length = 7)
    private String yearMonth;

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

    @Column(name = "avg_price", precision = 15, scale = 2)
    private BigDecimal avgPrice;

    @Column(name = "price_change", precision = 15, scale = 2)
    private BigDecimal priceChange;

    @Column(name = "price_change_percent", precision = 5, scale = 2)
    private BigDecimal priceChangePercent;

    @Column(name = "trading_days")
    private Integer tradingDays;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
