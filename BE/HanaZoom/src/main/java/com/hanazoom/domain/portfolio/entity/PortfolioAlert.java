package com.hanazoom.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_alerts")
@Getter
@Setter
@NoArgsConstructor
public class PortfolioAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "stock_symbol", length = 20)
    private String stockSymbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false)
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false)
    private ConditionType conditionType;

    @Column(name = "threshold_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal thresholdValue;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_method", nullable = false)
    private NotificationMethod notificationMethod = NotificationMethod.PUSH;

    @Column(name = "custom_message", columnDefinition = "TEXT")
    private String customMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public PortfolioAlert(Account account, String stockSymbol, AlertType alertType,
            ConditionType conditionType, BigDecimal thresholdValue,
            NotificationMethod notificationMethod, String customMessage) {
        this.account = account;
        this.stockSymbol = stockSymbol;
        this.alertType = alertType;
        this.conditionType = conditionType;
        this.thresholdValue = thresholdValue;
        this.notificationMethod = notificationMethod != null ? notificationMethod : NotificationMethod.PUSH;
        this.customMessage = customMessage;
    }


    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }


    public void updateAlertCondition(AlertType alertType, ConditionType conditionType,
            BigDecimal thresholdValue) {
        this.alertType = alertType;
        this.conditionType = conditionType;
        this.thresholdValue = thresholdValue;
    }


    public void updateNotificationMethod(NotificationMethod notificationMethod) {
        this.notificationMethod = notificationMethod;
    }


    public void updateCustomMessage(String customMessage) {
        this.customMessage = customMessage;
    }


    public boolean isPortfolioWideAlert() {
        return this.stockSymbol == null;
    }


    public boolean isStockSpecificAlert() {
        return this.stockSymbol != null;
    }


    public boolean checkPriceCondition(BigDecimal currentPrice) {
        if (this.alertType != AlertType.PRICE || !this.isActive) {
            return false;
        }

        switch (this.conditionType) {
            case ABOVE:
                return currentPrice.compareTo(this.thresholdValue) >= 0;
            case BELOW:
                return currentPrice.compareTo(this.thresholdValue) <= 0;
            case EQUAL:
                return currentPrice.compareTo(this.thresholdValue) == 0;
            default:
                return false;
        }
    }


    public boolean checkProfitLossCondition(BigDecimal currentProfitLoss) {
        if (this.alertType != AlertType.PROFIT_LOSS || !this.isActive) {
            return false;
        }

        switch (this.conditionType) {
            case ABOVE:
                return currentProfitLoss.compareTo(this.thresholdValue) >= 0;
            case BELOW:
                return currentProfitLoss.compareTo(this.thresholdValue) <= 0;
            case EQUAL:
                return currentProfitLoss.compareTo(this.thresholdValue) == 0;
            default:
                return false;
        }
    }


    public boolean checkQuantityCondition(Integer currentQuantity) {
        if (this.alertType != AlertType.QUANTITY || !this.isActive) {
            return false;
        }

        switch (this.conditionType) {
            case ABOVE:
                return currentQuantity >= this.thresholdValue.intValue();
            case BELOW:
                return currentQuantity <= this.thresholdValue.intValue();
            case EQUAL:
                return currentQuantity.equals(this.thresholdValue.intValue());
            default:
                return false;
        }
    }


    public boolean checkAllocationCondition(BigDecimal currentAllocationRate) {
        if (this.alertType != AlertType.ALLOCATION || !this.isActive) {
            return false;
        }

        switch (this.conditionType) {
            case ABOVE:
                return currentAllocationRate.compareTo(this.thresholdValue) >= 0;
            case BELOW:
                return currentAllocationRate.compareTo(this.thresholdValue) <= 0;
            case EQUAL:
                return currentAllocationRate.compareTo(this.thresholdValue) == 0;
            default:
                return false;
        }
    }


    public String generateAlertMessage() {
        if (this.customMessage != null && !this.customMessage.trim().isEmpty()) {
            return this.customMessage;
        }

        String baseMessage = String.format("[%s] %s 알림",
                this.account.getAccountName(),
                this.alertType.getDescription());

        if (this.stockSymbol != null) {
            baseMessage += String.format(" - %s", this.stockSymbol);
        }

        baseMessage += String.format(" (%s %s)",
                this.conditionType.getDescription(),
                this.thresholdValue.toString());

        return baseMessage;
    }
}
