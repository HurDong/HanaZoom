package com.hanazoom.domain.watchlist.entity;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "watchlist")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_symbol", referencedColumnName = "symbol", nullable = false)
    private Stock stock;

    @Column(name = "alert_price", precision = 15, scale = 2)
    private BigDecimal alertPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", length = 10)
    private AlertType alertType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Watchlist(Member member, Stock stock, BigDecimal alertPrice, AlertType alertType) {
        this.member = member;
        this.stock = stock;
        this.alertPrice = alertPrice;
        this.alertType = alertType != null ? alertType : AlertType.BOTH;
        this.isActive = true;
    }


    public void deactivate() {
        this.isActive = false;
    }


    public void activate() {
        this.isActive = true;
    }


    public void setAlertPrice(BigDecimal alertPrice) {
        this.alertPrice = alertPrice;
    }


    public void setAlertType(AlertType alertType) {
        this.alertType = alertType;
    }


    public void removeAlert() {
        this.alertPrice = null;
        this.alertType = null;
    }


    public boolean needsPriceAlert(BigDecimal currentPrice) {
        if (!this.isActive || this.alertPrice == null) {
            return false;
        }

        switch (this.alertType) {
            case ABOVE:
                return currentPrice.compareTo(this.alertPrice) >= 0;
            case BELOW:
                return currentPrice.compareTo(this.alertPrice) <= 0;
            case BOTH:
                return currentPrice.compareTo(this.alertPrice) == 0;
            default:
                return false;
        }
    }
}
