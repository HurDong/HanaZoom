package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockBasicInfoResponse {

    private String stockCode; 
    private String stockName; 
    private String marketName; 
    private String sector; 
    private String listingShares; 
    private String faceValue; 
    private String capital; 
    private String listingDate; 
    private String ceoName; 
    private String website; 
    private String region; 
    private String closingMonth; 
    private String mainBusiness; 
    private String per; 
    private String pbr; 
    private String eps; 
    private String bps; 
    private String dividend; 
    private String dividendYield; 

    public String getMarketType() {
        if (marketName == null)
            return "기타";

        if (marketName.contains("KOSPI"))
            return "KOSPI";
        if (marketName.contains("KOSDAQ"))
            return "KOSDAQ";
        if (marketName.contains("KONEX"))
            return "KONEX";

        return "기타";
    }

    public boolean isPerValid() {
        try {
            double perValue = Double.parseDouble(per);
            return perValue > 0 && perValue < 1000; 
        } catch (NumberFormatException | NullPointerException e) {
            return false;
        }
    }

    public boolean isPbrValid() {
        try {
            double pbrValue = Double.parseDouble(pbr);
            return pbrValue > 0 && pbrValue < 100; 
        } catch (NumberFormatException | NullPointerException e) {
            return false;
        }
    }
}
