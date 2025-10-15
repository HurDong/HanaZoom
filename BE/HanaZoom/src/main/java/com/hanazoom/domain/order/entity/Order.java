package com.hanazoom.domain.order.entity;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType; 

    @Enumerated(EnumType.STRING)
    @Column(name = "order_method", nullable = false)
    private OrderMethod orderMethod; 

    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING; 

    @Column(name = "filled_quantity", nullable = false)
    @Builder.Default
    private Integer filledQuantity = 0;

    @Column(name = "filled_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal filledAmount = BigDecimal.ZERO;

    @Column(name = "average_filled_price", precision = 15, scale = 2)
    private BigDecimal averageFilledPrice;

    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;

    @Column(name = "filled_time")
    private LocalDateTime filledTime;

    @Column(name = "cancel_time")
    private LocalDateTime cancelTime;

    @Column(name = "reject_reason")
    private String rejectReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum OrderType {
        BUY, SELL
    }

    public enum OrderMethod {
        LIMIT, MARKET
    }

    public enum OrderStatus {
        PENDING,        
        PARTIAL_FILLED, 
        FILLED,         
        CANCELLED,      
        REJECTED        
    }


    public void fill(int fillQuantity, BigDecimal fillPrice) {
        this.filledQuantity += fillQuantity;
        this.filledAmount = this.filledAmount.add(fillPrice.multiply(BigDecimal.valueOf(fillQuantity)));
        
        if (this.filledQuantity > 0) {
            this.averageFilledPrice = this.filledAmount.divide(BigDecimal.valueOf(this.filledQuantity), 2, BigDecimal.ROUND_HALF_UP);
        }
        
        if (this.filledQuantity >= this.quantity) {
            this.status = OrderStatus.FILLED;
            this.filledTime = LocalDateTime.now();
        } else {
            this.status = OrderStatus.PARTIAL_FILLED;
        }
    }

    public void cancel() {
        this.status = OrderStatus.CANCELLED;
        this.cancelTime = LocalDateTime.now();
    }

    public void reject(String reason) {
        this.status = OrderStatus.REJECTED;
        this.rejectReason = reason;
    }


    public int getRemainingQuantity() {
        return this.quantity - this.filledQuantity;
    }


    public double getFillRate() {
        if (this.quantity == 0) return 0.0;
        return (double) this.filledQuantity / this.quantity * 100;
    }
    

    public void updateStatus(OrderStatus status) {
        this.status = status;
    }
    

    public void updateCancelledAt(LocalDateTime cancelledAt) {
        this.cancelTime = cancelledAt;
    }
}

