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
    private String stockName; 


    private Integer quantity; 
    private Integer availableQuantity; 
    private Integer frozenQuantity; 


    private BigDecimal avgPurchasePrice; 
    private BigDecimal totalPurchaseAmount; 


    private BigDecimal currentPrice; 
    private BigDecimal currentValue; 
    private BigDecimal profitLoss; 
    private BigDecimal profitLossRate; 


    private LocalDate firstPurchaseDate; 
    private LocalDate lastPurchaseDate; 
    private LocalDate lastSaleDate; 


    private BigDecimal allocationRate; 


    private boolean isProfitable; 
    private String performanceStatus; 
}
