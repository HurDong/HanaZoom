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
@Table(name = "account_balances")
@Getter
@Setter
@NoArgsConstructor
public class AccountBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "balance_date", nullable = false)
    private LocalDate balanceDate;

    // 현금 잔고
    @Column(name = "cash_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal cashBalance = BigDecimal.ZERO;

    @Column(name = "available_cash", nullable = false, precision = 15, scale = 2)
    private BigDecimal availableCash = BigDecimal.ZERO;

    @Column(name = "frozen_cash", nullable = false, precision = 15, scale = 2)
    private BigDecimal frozenCash = BigDecimal.ZERO;

    // 주식 평가 정보
    @Column(name = "total_stock_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalStockValue = BigDecimal.ZERO;

    @Column(name = "total_profit_loss", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalProfitLoss = BigDecimal.ZERO;

    @Column(name = "total_profit_loss_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal totalProfitLossRate = BigDecimal.ZERO;

    // 계좌 총액
    @Column(name = "total_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalBalance = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public AccountBalance(Account account, LocalDate balanceDate, BigDecimal cashBalance,
            BigDecimal availableCash, BigDecimal frozenCash, BigDecimal totalStockValue,
            BigDecimal totalProfitLoss, BigDecimal totalProfitLossRate) {
        this.account = account;
        this.balanceDate = balanceDate;
        this.cashBalance = cashBalance != null ? cashBalance : BigDecimal.ZERO;
        this.availableCash = availableCash != null ? availableCash : BigDecimal.ZERO;
        this.frozenCash = frozenCash != null ? frozenCash : BigDecimal.ZERO;
        this.totalStockValue = totalStockValue != null ? totalStockValue : BigDecimal.ZERO;
        this.totalProfitLoss = totalProfitLoss != null ? totalProfitLoss : BigDecimal.ZERO;
        this.totalProfitLossRate = totalProfitLossRate != null ? totalProfitLossRate : BigDecimal.ZERO;
        calculateTotalBalance();
    }

    // 총 잔고 계산
    public void calculateTotalBalance() {
        this.totalBalance = this.cashBalance.add(this.totalStockValue);
    }

    // 현금 잔고 업데이트
    public void updateCashBalance(BigDecimal cashBalance, BigDecimal availableCash, BigDecimal frozenCash) {
        this.cashBalance = cashBalance != null ? cashBalance : BigDecimal.ZERO;
        this.availableCash = availableCash != null ? availableCash : BigDecimal.ZERO;
        this.frozenCash = frozenCash != null ? frozenCash : BigDecimal.ZERO;
        calculateTotalBalance();
    }

    // 주식 평가 정보 업데이트
    public void updateStockValue(BigDecimal totalStockValue, BigDecimal totalProfitLoss,
            BigDecimal totalProfitLossRate) {
        this.totalStockValue = totalStockValue != null ? totalStockValue : BigDecimal.ZERO;
        this.totalProfitLoss = totalProfitLoss != null ? totalProfitLoss : BigDecimal.ZERO;
        this.totalProfitLossRate = totalProfitLossRate != null ? totalProfitLossRate : BigDecimal.ZERO;
        calculateTotalBalance();
    }

    // 전체 잔고 정보 업데이트
    public void updateBalance(BigDecimal cashBalance, BigDecimal availableCash, BigDecimal frozenCash,
            BigDecimal totalStockValue, BigDecimal totalProfitLoss, BigDecimal totalProfitLossRate) {
        updateCashBalance(cashBalance, availableCash, frozenCash);
        updateStockValue(totalStockValue, totalProfitLoss, totalProfitLossRate);
    }
}
