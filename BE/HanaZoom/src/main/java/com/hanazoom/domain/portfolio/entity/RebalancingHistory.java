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
@Table(name = "rebalancing_history")
@Getter
@Setter
@NoArgsConstructor
public class RebalancingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(name = "rebalancing_type", nullable = false)
    private RebalancingType rebalancingType;

    @Column(name = "rebalancing_date", nullable = false)
    private LocalDate rebalancingDate;


    @Column(name = "before_total_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal beforeTotalValue;

    @Column(name = "after_total_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal afterTotalValue;


    @Column(name = "trades_executed", nullable = false)
    private Integer tradesExecuted = 0;

    @Column(name = "total_commission", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalCommission = BigDecimal.ZERO;


    @Column(name = "target_allocation", nullable = false, columnDefinition = "TEXT")
    private String targetAllocation;

    @Column(name = "actual_allocation", nullable = false, columnDefinition = "TEXT")
    private String actualAllocation;


    @Column(name = "rebalancing_reason", columnDefinition = "TEXT")
    private String rebalancingReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public RebalancingHistory(Account account, RebalancingType rebalancingType,
            LocalDate rebalancingDate, BigDecimal beforeTotalValue,
            BigDecimal afterTotalValue, Integer tradesExecuted,
            BigDecimal totalCommission, String targetAllocation,
            String actualAllocation, String rebalancingReason) {
        this.account = account;
        this.rebalancingType = rebalancingType;
        this.rebalancingDate = rebalancingDate != null ? rebalancingDate : LocalDate.now();
        this.beforeTotalValue = beforeTotalValue;
        this.afterTotalValue = afterTotalValue;
        this.tradesExecuted = tradesExecuted != null ? tradesExecuted : 0;
        this.totalCommission = totalCommission != null ? totalCommission : BigDecimal.ZERO;
        this.targetAllocation = targetAllocation;
        this.actualAllocation = actualAllocation;
        this.rebalancingReason = rebalancingReason;
    }


    public BigDecimal getValueChange() {
        return this.afterTotalValue.subtract(this.beforeTotalValue);
    }

    public BigDecimal getValueChangeRate() {
        if (this.beforeTotalValue.compareTo(BigDecimal.ZERO) > 0) {
            return this.getValueChange()
                    .divide(this.beforeTotalValue, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }


    public BigDecimal getCommissionRate() {
        if (this.beforeTotalValue.compareTo(BigDecimal.ZERO) > 0) {
            return this.totalCommission
                    .divide(this.beforeTotalValue, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }


    public boolean isSuccessful() {

        return this.targetAllocation.equals(this.actualAllocation);
    }


    public BigDecimal getEfficiency() {
        if (this.beforeTotalValue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal valueGain = this.getValueChange();
            BigDecimal totalCost = this.totalCommission;

            if (totalCost.compareTo(BigDecimal.ZERO) > 0) {
                return valueGain.divide(totalCost, 4, BigDecimal.ROUND_HALF_UP);
            }
        }
        return BigDecimal.ZERO;
    }


    public String getRebalancingDescription() {
        String baseDescription = String.format("%s 리밸런싱", this.rebalancingType.getDescription());

        if (this.rebalancingReason != null && !this.rebalancingReason.trim().isEmpty()) {
            baseDescription += String.format(" - %s", this.rebalancingReason);
        }

        return baseDescription;
    }


    public String getTradeEfficiencyGrade() {
        if (this.tradesExecuted == 0) {
            return "N/A";
        }

        BigDecimal efficiency = this.getEfficiency();
        if (efficiency.compareTo(BigDecimal.valueOf(10)) >= 0) {
            return "A+";
        } else if (efficiency.compareTo(BigDecimal.valueOf(5)) >= 0) {
            return "A";
        } else if (efficiency.compareTo(BigDecimal.valueOf(2)) >= 0) {
            return "B+";
        } else if (efficiency.compareTo(BigDecimal.valueOf(1)) >= 0) {
            return "B";
        } else if (efficiency.compareTo(BigDecimal.ZERO) >= 0) {
            return "C";
        } else {
            return "D";
        }
    }


    public String getResultSummary() {
        return String.format("리밸런싱 결과: %s → %s (변화: %s, 수수료: %s)",
                this.beforeTotalValue.toString(),
                this.afterTotalValue.toString(),
                this.getValueChange().toString(),
                this.totalCommission.toString());
    }
}
