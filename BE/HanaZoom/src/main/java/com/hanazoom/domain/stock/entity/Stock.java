package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stocks", indexes = {
    @Index(name = "idx_stocks_symbol", columnList = "symbol", unique = true),
    @Index(name = "idx_stocks_active", columnList = "is_active"),
    @Index(name = "idx_stocks_market", columnList = "market"),
    @Index(name = "idx_stocks_sector", columnList = "sector"),
    @Index(name = "idx_stocks_last_updated", columnList = "last_updated")
})
@Getter
@Setter
@NoArgsConstructor
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String market;

    @Column
    private String sector;

    @Column(name = "current_price")
    private BigDecimal currentPrice;

    @Column(name = "price_change")
    private BigDecimal priceChange;

    @Column(name = "price_change_percent")
    private BigDecimal priceChangePercent;

    @Column
    private Long volume;

    @Column(name = "market_cap")
    private Long marketCap;

    @Column(name = "high_price")
    private BigDecimal highPrice;

    @Column(name = "low_price")
    private BigDecimal lowPrice;

    @Column(name = "open_price")
    private BigDecimal openPrice;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "is_active", nullable = true)
    private Boolean isActive = true;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}