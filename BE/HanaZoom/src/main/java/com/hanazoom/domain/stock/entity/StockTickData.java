package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_tick_data", uniqueConstraints = @UniqueConstraint(columnNames = { "stock_symbol", "timestamp",
        "sequence" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class StockTickData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stock_symbol", nullable = false, length = 20)
    private String stockSymbol;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "sequence", nullable = false)
    private Long sequence;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "volume", nullable = false)
    private Long volume;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", length = 10)
    private TradeType tradeType;

    @Column(name = "bid_price", precision = 15, scale = 2)
    private BigDecimal bidPrice;

    @Column(name = "ask_price", precision = 15, scale = 2)
    private BigDecimal askPrice;

    @Column(name = "bid_volume")
    private Long bidVolume;

    @Column(name = "ask_volume")
    private Long askVolume;

    @Column(name = "total_trade_count")
    private Long totalTradeCount;

    @Column(name = "total_trade_volume")
    private Long totalTradeVolume;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TradeType {
        BUY, SELL, UNKNOWN
    }
}
