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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_balance_id", nullable = false)
    private AccountBalance accountBalance;

    @Column(name = "trade_history_id", nullable = false)
    private Long tradeHistoryId; // 매도 거래 내역 ID

    @Column(name = "settlement_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal settlementAmount; // 정산될 금액

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate; // 매도 거래일

    @Column(name = "settlement_date", nullable = false)
    private LocalDate settlementDate; // 정산 완료일 (3영업일 후)

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
        PENDING, // 정산 대기 중
        COMPLETED, // 정산 완료
        CANCELLED // 정산 취소
    }

    @Builder
    public SettlementSchedule(AccountBalance accountBalance, Long tradeHistoryId,
            BigDecimal settlementAmount, LocalDate tradeDate) {
        this.accountBalance = accountBalance;
        this.tradeHistoryId = tradeHistoryId;
        this.settlementAmount = settlementAmount;
        this.tradeDate = tradeDate;
        calculateSettlementDate();
    }

    // 정산일 계산 (영업일 기준)
    public void calculateSettlementDate() {
        this.settlementDate = calculateBusinessDaysAfter(this.tradeDate, 3);
    }

    // 영업일 계산 (주말 제외)
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

    // 정산 완료 처리
    public void completeSettlement() {
        this.status = SettlementStatus.COMPLETED;
    }

    // 정산 취소 처리
    public void cancelSettlement() {
        this.status = SettlementStatus.CANCELLED;
    }
}
