package com.hanazoom.domain.portfolio.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PortfolioStockResponse {

    private Long id;
    private String stockSymbol;
    private String stockName; // 종목명 (추후 Stock 엔티티 연동)

    // 보유 수량
    private Integer quantity; // 총 보유 수량
    private Integer availableQuantity; // 매도 가능 수량
    private Integer frozenQuantity; // 동결 수량

    // 매수 정보
    private BigDecimal avgPurchasePrice; // 평균 매수가
    private BigDecimal totalPurchaseAmount; // 총 매수 금액

    // 현재 평가 정보
    private BigDecimal currentPrice; // 현재가
    private BigDecimal currentValue; // 현재 평가금액
    private BigDecimal profitLoss; // 손익
    private BigDecimal profitLossRate; // 손익률 (%)

    // 거래 정보
    private LocalDate firstPurchaseDate; // 최초 매수일
    private LocalDate lastPurchaseDate; // 최근 매수일
    private LocalDate lastSaleDate; // 최근 매도일

    // 종목별 비중
    private BigDecimal allocationRate; // 포트폴리오 내 비중 (%)

    // 성과 정보
    private boolean isProfitable; // 수익 종목 여부
    private String performanceStatus; // 성과 상태 (상승/하락/보합)
}
