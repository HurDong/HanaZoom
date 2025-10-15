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

@Entity
@Table(name = "portfolio_stocks")
@Getter
@Setter
@NoArgsConstructor
public class PortfolioStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "stock_symbol", nullable = false, length = 20)
    private String stockSymbol;


    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity = 0;

    @Column(name = "frozen_quantity", nullable = false)
    private Integer frozenQuantity = 0;


    @Column(name = "avg_purchase_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal avgPurchasePrice = BigDecimal.ZERO;

    @Column(name = "total_purchase_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPurchaseAmount = BigDecimal.ZERO;


    @Column(name = "current_price", precision = 15, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "current_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentValue = BigDecimal.ZERO;

    @Column(name = "profit_loss", nullable = false, precision = 15, scale = 2)
    private BigDecimal profitLoss = BigDecimal.ZERO;

    @Column(name = "profit_loss_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal profitLossRate = BigDecimal.ZERO;


    @Column(name = "first_purchase_date")
    private LocalDate firstPurchaseDate;

    @Column(name = "last_purchase_date")
    private LocalDate lastPurchaseDate;

    @Column(name = "last_sale_date")
    private LocalDate lastSaleDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public PortfolioStock(Long accountId, String stockSymbol, Integer quantity,
            BigDecimal avgPurchasePrice, BigDecimal totalPurchaseAmount) {
        this.accountId = accountId;
        this.stockSymbol = stockSymbol;
        this.quantity = quantity != null ? quantity : 0;
        this.availableQuantity = this.quantity;
        this.avgPurchasePrice = avgPurchasePrice != null ? avgPurchasePrice : BigDecimal.ZERO;
        this.totalPurchaseAmount = totalPurchaseAmount != null ? totalPurchaseAmount : BigDecimal.ZERO;
        this.firstPurchaseDate = LocalDate.now();
        this.lastPurchaseDate = LocalDate.now();
    }


    public void buy(Integer quantity, BigDecimal price) {
        if (quantity <= 0 || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("수량과 가격은 0보다 커야 합니다.");
        }

        BigDecimal newTotalAmount = this.totalPurchaseAmount.add(price.multiply(BigDecimal.valueOf(quantity)));
        int newTotalQuantity = this.quantity + quantity;


        this.avgPurchasePrice = newTotalAmount.divide(BigDecimal.valueOf(newTotalQuantity), 2,
                java.math.RoundingMode.HALF_UP);
        this.totalPurchaseAmount = newTotalAmount;
        this.quantity = newTotalQuantity;
        this.availableQuantity += quantity;
        this.lastPurchaseDate = LocalDate.now();

        updateCurrentValue();
    }


    public void sell(Integer quantity) {
        if (quantity <= 0 || quantity > this.availableQuantity) {
            throw new IllegalArgumentException("매도 가능한 수량이 부족합니다.");
        }


        BigDecimal sellAmount = this.avgPurchasePrice.multiply(BigDecimal.valueOf(quantity));
        this.totalPurchaseAmount = this.totalPurchaseAmount.subtract(sellAmount);
        
        this.quantity -= quantity;
        this.availableQuantity -= quantity;
        this.lastSaleDate = LocalDate.now();


        if (this.quantity == 0) {
            this.avgPurchasePrice = BigDecimal.ZERO;
            this.totalPurchaseAmount = BigDecimal.ZERO;
        }

        updateCurrentValue();
    }


    public void updateCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
        updateCurrentValue();
    }


    public void updateCurrentValue() {
        if (this.currentPrice != null && this.quantity > 0 && this.totalPurchaseAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.currentValue = this.currentPrice.multiply(BigDecimal.valueOf(this.quantity));
            this.profitLoss = this.currentValue.subtract(this.totalPurchaseAmount);


            this.profitLossRate = this.profitLoss
                    .divide(this.totalPurchaseAmount, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        } else {

            this.currentValue = BigDecimal.ZERO;
            this.profitLoss = BigDecimal.ZERO;
            this.profitLossRate = BigDecimal.ZERO;
        }
    }


    public void freezeQuantity(Integer quantity) {
        if (quantity > this.availableQuantity) {
            throw new IllegalArgumentException("동결할 수량이 매도 가능 수량을 초과합니다.");
        }
        this.availableQuantity -= quantity;
        this.frozenQuantity += quantity;
    }

    public void unfreezeQuantity(Integer quantity) {
        if (quantity > this.frozenQuantity) {
            throw new IllegalArgumentException("해제할 수량이 동결 수량을 초과합니다.");
        }
        this.frozenQuantity -= quantity;
        this.availableQuantity += quantity;
    }


    public boolean hasQuantity(int quantity) {
        return this.availableQuantity >= quantity;
    }


    public boolean isProfitable() {
        return this.profitLoss.compareTo(BigDecimal.ZERO) > 0;
    }
}
