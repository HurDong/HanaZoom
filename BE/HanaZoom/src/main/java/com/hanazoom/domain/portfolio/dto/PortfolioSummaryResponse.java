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


    private BigDecimal availableCash; 
    private BigDecimal settlementCash; 
    private BigDecimal withdrawableCash; 
    private BigDecimal frozenCash; 
    private BigDecimal totalCash; 


    private BigDecimal totalStockValue; 
    private BigDecimal totalProfitLoss; 
    private BigDecimal totalProfitLossRate; 


    private BigDecimal totalBalance; 


    private int totalStockCount; 
    private BigDecimal stockAllocationRate; 
    private BigDecimal cashAllocationRate; 


    private BigDecimal dailyReturn; 
    private BigDecimal monthlyReturn; 
    private BigDecimal yearlyReturn; 
}
