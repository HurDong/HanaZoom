package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockPriceResponse {

    private String stockCode; 
    private String stockName; 
    private String currentPrice; 
    private String changePrice; 
    private String changeRate; 
    private String changeSign; 
    private String openPrice; 
    private String highPrice; 
    private String lowPrice; 
    private String volume; 
    private String volumeRatio; 
    private String marketCap; 
    private String previousClose; 
    private String updatedTime; 
    private boolean isMarketOpen; 
    private boolean isAfterMarketClose; 
    private String marketStatus; 


    private List<OrderBookItem> askOrders; 
    private List<OrderBookItem> bidOrders; 
    private String totalAskQuantity; 
    private String totalBidQuantity; 
    private double imbalanceRatio; 
    private int spread; 
    private boolean buyDominant; 
    private boolean sellDominant; 

    public String getChangeStatus() {
        switch (changeSign) {
            case "1":
                return "상한가";
            case "2":
                return "상승";
            case "3":
                return "보합";
            case "4":
                return "하락";
            case "5":
                return "하한가";
            default:
                return "보합";
        }
    }

    public boolean isPositiveChange() {
        return "1".equals(changeSign) || "2".equals(changeSign);
    }

    public boolean isNegativeChange() {
        return "4".equals(changeSign) || "5".equals(changeSign);
    }

    public boolean hasOrderBookData() {
        return askOrders != null && !askOrders.isEmpty() && 
               bidOrders != null && !bidOrders.isEmpty();
    }

    public String getBestBidPrice() {
        return bidOrders != null && !bidOrders.isEmpty() ? bidOrders.get(0).getPrice() : "0";
    }

    public String getBestAskPrice() {
        return askOrders != null && !askOrders.isEmpty() ? askOrders.get(0).getPrice() : "0";
    }

    public void calculateSpread() {
        if (hasOrderBookData()) {
            int bestAsk = Integer.parseInt(getBestAskPrice());
            int bestBid = Integer.parseInt(getBestBidPrice());
            this.spread = bestAsk - bestBid;
        }
    }

    public void calculateImbalanceRatio() {
        if (hasOrderBookData()) {
            long totalAsk = Long.parseLong(totalAskQuantity != null ? totalAskQuantity : "0");
            long totalBid = Long.parseLong(totalBidQuantity != null ? totalBidQuantity : "0");
            long total = totalAsk + totalBid;
            
            if (total > 0) {
                this.imbalanceRatio = (double) totalBid / total;
                this.buyDominant = imbalanceRatio > 0.6;
                this.sellDominant = imbalanceRatio < 0.4;
            }
        }
    }
}
