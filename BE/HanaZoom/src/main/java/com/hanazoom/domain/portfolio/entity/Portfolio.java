package com.hanazoom.domain.portfolio.entity;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
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
@Table(name = "portfolios")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(name = "quantity", nullable = false)
    private Long quantity = 0L;

    @Column(name = "average_price", precision = 10, scale = 2)
    private BigDecimal averagePrice = BigDecimal.ZERO;

    @Column(name = "total_investment", precision = 15, scale = 2)
    private BigDecimal totalInvestment = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Portfolio(Member member, Stock stock, Long quantity, BigDecimal averagePrice, BigDecimal totalInvestment) {
        this.member = member;
        this.stock = stock;
        this.quantity = quantity;
        this.averagePrice = averagePrice;
        this.totalInvestment = totalInvestment;
    }

    public void updateQuantity(Long newQuantity) {
        this.quantity = newQuantity;
    }

    public void updateAveragePrice(BigDecimal newAveragePrice) {
        this.averagePrice = newAveragePrice;
    }

    public void updateTotalInvestment(BigDecimal newTotalInvestment) {
        this.totalInvestment = newTotalInvestment;
    }

    public void addQuantity(Long quantity) {
        this.quantity += quantity;
    }

    public void subtractQuantity(Long quantity) {
        this.quantity -= quantity;
    }

    public void updateAveragePrice(BigDecimal newPrice, Long newQuantity) {
        if (this.quantity == 0) {
            this.averagePrice = newPrice;
        } else {
            BigDecimal totalValue = this.averagePrice.multiply(BigDecimal.valueOf(this.quantity))
                    .add(newPrice.multiply(BigDecimal.valueOf(newQuantity)));
            this.averagePrice = totalValue.divide(BigDecimal.valueOf(this.quantity + newQuantity), 2, java.math.RoundingMode.HALF_UP);
        }
    }
}
