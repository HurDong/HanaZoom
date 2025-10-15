package com.hanazoom.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "trade_history")
@Getter
@Setter
@NoArgsConstructor
public class TradeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "stock_symbol", nullable = false, length = 20)
    private String stockSymbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false)
    private TradeType tradeType;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "trade_time")
    private LocalTime tradeTime;


    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_per_share", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerShare;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;


    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal commission = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;


    @Column(name = "balance_after_trade", precision = 15, scale = 2)
    private BigDecimal balanceAfterTrade;

    @Column(name = "stock_quantity_after_trade")
    private Integer stockQuantityAfterTrade;


    @Column(name = "trade_memo", columnDefinition = "TEXT")
    private String tradeMemo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public TradeHistory(Long accountId, String stockSymbol, TradeType tradeType,
            LocalDate tradeDate, LocalTime tradeTime, Integer quantity,
            BigDecimal pricePerShare, BigDecimal totalAmount, BigDecimal commission,
            BigDecimal tax, BigDecimal balanceAfterTrade, Integer stockQuantityAfterTrade, String tradeMemo) {
        this.accountId = accountId;
        this.stockSymbol = stockSymbol;
        this.tradeType = tradeType;
        this.tradeDate = tradeDate != null ? tradeDate : LocalDate.now();
        this.tradeTime = tradeTime;
        this.quantity = quantity;
        this.pricePerShare = pricePerShare;
        this.totalAmount = totalAmount;
        this.commission = commission != null ? commission : BigDecimal.ZERO;
        this.tax = tax != null ? tax : BigDecimal.ZERO;
        this.balanceAfterTrade = balanceAfterTrade;
        this.stockQuantityAfterTrade = stockQuantityAfterTrade;
        this.tradeMemo = tradeMemo;

        calculateNetAmount();
    }


    private void calculateNetAmount() {
        if (this.tradeType == TradeType.BUY) {

            this.netAmount = this.totalAmount.add(this.commission).add(this.tax);
        } else {

            this.netAmount = this.totalAmount.subtract(this.commission).subtract(this.tax);
        }
    }


    public void setBalanceAfterTrade(BigDecimal balanceAfterTrade, Integer stockQuantityAfterTrade) {
        this.balanceAfterTrade = balanceAfterTrade;
        this.stockQuantityAfterTrade = stockQuantityAfterTrade;
    }


    public void updateTradeMemo(String tradeMemo) {
        this.tradeMemo = tradeMemo;
    }


    public boolean isValidAmount() {
        return this.totalAmount.compareTo(BigDecimal.ZERO) > 0 &&
                this.pricePerShare.compareTo(BigDecimal.ZERO) > 0 &&
                this.quantity > 0;
    }


    public boolean isBuyTrade() {
        return this.tradeType == TradeType.BUY;
    }


    public boolean isSellTrade() {
        return this.tradeType == TradeType.SELL;
    }


    public boolean isDividendTrade() {
        return this.tradeType == TradeType.DIVIDEND;
    }


    public BigDecimal getTotalCost() {
        return this.commission.add(this.tax);
    }
}
