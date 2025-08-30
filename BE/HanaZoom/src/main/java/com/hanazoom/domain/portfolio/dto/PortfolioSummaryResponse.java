package com.hanazoom.domain.portfolio.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PortfolioSummaryResponse {

    private Long accountId;
    private String accountNumber;
    private String accountName;
    private LocalDate balanceDate;

    // 현금 잔고
    private BigDecimal availableCash; // 즉시 사용 가능
    private BigDecimal settlementCash; // 정산 대기 (3영업일 후)
    private BigDecimal withdrawableCash; // 인출 가능
    private BigDecimal frozenCash; // 동결 현금
    private BigDecimal totalCash; // 총 현금

    // 주식 평가 정보
    private BigDecimal totalStockValue; // 총 주식 평가금액
    private BigDecimal totalProfitLoss; // 총 손익
    private BigDecimal totalProfitLossRate; // 총 손익률

    // 계좌 총액
    private BigDecimal totalBalance; // 계좌 총액 (현금 + 주식)

    // 포트폴리오 구성
    private int totalStockCount; // 보유 종목 수
    private BigDecimal stockAllocationRate; // 주식 비중 (%)
    private BigDecimal cashAllocationRate; // 현금 비중 (%)

    // 성과 정보
    private BigDecimal dailyReturn; // 일일 수익률
    private BigDecimal monthlyReturn; // 월간 수익률
    private BigDecimal yearlyReturn; // 연간 수익률
}
