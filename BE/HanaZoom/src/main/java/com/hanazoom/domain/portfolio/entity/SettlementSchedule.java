package com.hanazoom.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlement_schedules")
@Getter
@Setter
@NoArgsConstructor
public class SettlementSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_balance_id", nullable = false, insertable = false, updatable = false)
    private Long accountBalanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_balance_id", nullable = false)
    private AccountBalance accountBalance;

    @Column(name = "trade_history_id", nullable = false)
    private Long tradeHistoryId; 

    @Column(name = "settlement_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal settlementAmount; 

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate; 

    @Column(name = "settlement_date", nullable = false)
    private LocalDate settlementDate; 

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SettlementStatus status = SettlementStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SettlementStatus {
        PENDING, 
        COMPLETED, 
        CANCELLED 
    }

    @Builder
    public SettlementSchedule(Long accountBalanceId, Long tradeHistoryId,
            BigDecimal settlementAmount, LocalDate tradeDate) {
        this.accountBalanceId = accountBalanceId;
        this.tradeHistoryId = tradeHistoryId;
        this.settlementAmount = settlementAmount;
        this.tradeDate = tradeDate;
        calculateSettlementDate();
    }


    public void calculateSettlementDate() {
        this.settlementDate = calculateBusinessDaysAfter(this.tradeDate, 3);
    }


    private LocalDate calculateBusinessDaysAfter(LocalDate startDate, int businessDays) {
        LocalDate result = startDate;
        int addedDays = 0;

        while (addedDays < businessDays) {
            result = result.plusDays(1);
            if (result.getDayOfWeek() != DayOfWeek.SATURDAY &&
                    result.getDayOfWeek() != DayOfWeek.SUNDAY) {
                addedDays++;
            }
        }
        return result;
    }


    public void completeSettlement() {
        this.status = SettlementStatus.COMPLETED;
    }


    public void cancelSettlement() {
        this.status = SettlementStatus.CANCELLED;
    }


    public void setAccountBalance(AccountBalance accountBalance) {
        this.accountBalance = accountBalance;
        this.accountBalanceId = accountBalance.getId();
    }
}
