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
@Table(name = "portfolio_performance")
@Getter
@Setter
@NoArgsConstructor
public class PortfolioPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "performance_date", nullable = false)
    private LocalDate performanceDate;


    @Column(name = "daily_return", nullable = false, precision = 5, scale = 2)
    private BigDecimal dailyReturn = BigDecimal.ZERO;

    @Column(name = "daily_profit_loss", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyProfitLoss = BigDecimal.ZERO;


    @Column(name = "total_return", nullable = false, precision = 5, scale = 2)
    private BigDecimal totalReturn = BigDecimal.ZERO;

    @Column(name = "total_profit_loss", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalProfitLoss = BigDecimal.ZERO;


    @Column(precision = 5, scale = 2)
    private BigDecimal volatility;

    @Column(name = "sharpe_ratio", precision = 5, scale = 2)
    private BigDecimal sharpeRatio;

    @Column(name = "max_drawdown", precision = 5, scale = 2)
    private BigDecimal maxDrawdown;


    @Column(name = "stock_allocation_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal stockAllocationRate = BigDecimal.ZERO;

    @Column(name = "cash_allocation_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal cashAllocationRate = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public PortfolioPerformance(Account account, LocalDate performanceDate,
            BigDecimal dailyReturn, BigDecimal dailyProfitLoss,
            BigDecimal totalReturn, BigDecimal totalProfitLoss,
            BigDecimal volatility, BigDecimal sharpeRatio, BigDecimal maxDrawdown,
            BigDecimal stockAllocationRate, BigDecimal cashAllocationRate) {
        this.account = account;
        this.performanceDate = performanceDate != null ? performanceDate : LocalDate.now();
        this.dailyReturn = dailyReturn != null ? dailyReturn : BigDecimal.ZERO;
        this.dailyProfitLoss = dailyProfitLoss != null ? dailyProfitLoss : BigDecimal.ZERO;
        this.totalReturn = totalReturn != null ? totalReturn : BigDecimal.ZERO;
        this.totalProfitLoss = totalProfitLoss != null ? totalProfitLoss : BigDecimal.ZERO;
        this.volatility = volatility;
        this.sharpeRatio = sharpeRatio;
        this.maxDrawdown = maxDrawdown;
        this.stockAllocationRate = stockAllocationRate != null ? stockAllocationRate : BigDecimal.ZERO;
        this.cashAllocationRate = cashAllocationRate != null ? cashAllocationRate : BigDecimal.ZERO;
    }


    public void updateDailyPerformance(BigDecimal dailyReturn, BigDecimal dailyProfitLoss) {
        this.dailyReturn = dailyReturn != null ? dailyReturn : BigDecimal.ZERO;
        this.dailyProfitLoss = dailyProfitLoss != null ? dailyProfitLoss : BigDecimal.ZERO;
    }


    public void updateTotalPerformance(BigDecimal totalReturn, BigDecimal totalProfitLoss) {
        this.totalReturn = totalReturn != null ? totalReturn : BigDecimal.ZERO;
        this.totalProfitLoss = totalProfitLoss != null ? totalProfitLoss : BigDecimal.ZERO;
    }


    public void updateRiskMetrics(BigDecimal volatility, BigDecimal sharpeRatio, BigDecimal maxDrawdown) {
        this.volatility = volatility;
        this.sharpeRatio = sharpeRatio;
        this.maxDrawdown = maxDrawdown;
    }


    public void updateAllocation(BigDecimal stockAllocationRate, BigDecimal cashAllocationRate) {
        this.stockAllocationRate = stockAllocationRate != null ? stockAllocationRate : BigDecimal.ZERO;
        this.cashAllocationRate = cashAllocationRate != null ? cashAllocationRate : BigDecimal.ZERO;


        normalizeAllocation();
    }


    private void normalizeAllocation() {
        BigDecimal total = this.stockAllocationRate.add(this.cashAllocationRate);
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            this.stockAllocationRate = this.stockAllocationRate
                    .divide(total, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            this.cashAllocationRate = this.cashAllocationRate
                    .divide(total, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
    }


    public String getPerformanceGrade() {
        if (this.totalReturn.compareTo(BigDecimal.valueOf(20)) >= 0) {
            return "A+";
        } else if (this.totalReturn.compareTo(BigDecimal.valueOf(15)) >= 0) {
            return "A";
        } else if (this.totalReturn.compareTo(BigDecimal.valueOf(10)) >= 0) {
            return "B+";
        } else if (this.totalReturn.compareTo(BigDecimal.valueOf(5)) >= 0) {
            return "B";
        } else if (this.totalReturn.compareTo(BigDecimal.ZERO) >= 0) {
            return "C";
        } else if (this.totalReturn.compareTo(BigDecimal.valueOf(-5)) >= 0) {
            return "D";
        } else {
            return "F";
        }
    }


    public String getRiskGrade() {
        if (this.volatility == null) {
            return "N/A";
        }

        if (this.volatility.compareTo(BigDecimal.valueOf(10)) <= 0) {
            return "낮음";
        } else if (this.volatility.compareTo(BigDecimal.valueOf(20)) <= 0) {
            return "보통";
        } else if (this.volatility.compareTo(BigDecimal.valueOf(30)) <= 0) {
            return "높음";
        } else {
            return "매우 높음";
        }
    }


    public boolean isPositiveReturn() {
        return this.totalReturn.compareTo(BigDecimal.ZERO) > 0;
    }


    public boolean isPositiveDailyReturn() {
        return this.dailyReturn.compareTo(BigDecimal.ZERO) > 0;
    }
}
