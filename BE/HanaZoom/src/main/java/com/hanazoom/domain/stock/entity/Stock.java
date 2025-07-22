package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "stocks")
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "symbol", nullable = false, unique = true, length = 20)
    private String symbol;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "market", nullable = false, length = 20)
    private String market;

    @Column(name = "sector", length = 50)
    private String sector;

    @Column(name = "emoji", length = 10)
    private String emoji;

    @Column(name = "current_price", precision = 15, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "price_change", precision = 15, scale = 2)
    private BigDecimal priceChange;

    @Column(name = "price_change_percent", precision = 5, scale = 2)
    private BigDecimal priceChangePercent;

    @Column(name = "volume")
    private Long volume;

    @Column(name = "market_cap")
    private Long marketCap;

    @Column(name = "high_price", precision = 15, scale = 2)
    private BigDecimal highPrice;

    @Column(name = "low_price", precision = 15, scale = 2)
    private BigDecimal lowPrice;

    @Column(name = "open_price", precision = 15, scale = 2)
    private BigDecimal openPrice;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Stock(String symbol, String name, String market, String sector, String emoji) {
        this.symbol = symbol;
        this.name = name;
        this.market = market;
        this.sector = sector;
        this.emoji = emoji;
        this.isActive = true;
    }
}