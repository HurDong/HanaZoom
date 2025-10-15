package com.hanazoom.domain.region_stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopularityDetailsResponse {

    private Long regionId;
    private String symbol;
    private LocalDate date;


    private BigDecimal score;            
    private BigDecimal tradeTrend;       
    private BigDecimal community;        
    private BigDecimal momentum;         
    private BigDecimal newsImpact;       


    private BigDecimal weightTradeTrend; 
    private BigDecimal weightCommunity;  
    private BigDecimal weightMomentum;   
    private BigDecimal weightNews;       


    private int postCount;
    private int commentCount;
    private int voteCount;
    private int viewCount;

}


