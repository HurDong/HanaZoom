package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import com.hanazoom.domain.stock.dto.OrderBookItem;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBookResponse {

    private String stockCode; 
    private String stockName; 
    private String currentPrice; 
    private String updatedTime; 

    private List<OrderBookItem> askOrders; 
    private List<OrderBookItem> bidOrders; 

    private String totalAskQuantity; 
    private String totalBidQuantity; 



    public long getSpread() {
        if (askOrders.isEmpty() || bidOrders.isEmpty())
            return 0;

        long bestAsk = askOrders.get(0).getPriceAsLong(); 
        long bestBid = bidOrders.get(0).getPriceAsLong(); 

        return bestAsk - bestBid;
    }

    public double getImbalanceRatio() {
        try {
            long totalAsk = Long.parseLong(totalAskQuantity.replaceAll("[^0-9]", ""));
            long totalBid = Long.parseLong(totalBidQuantity.replaceAll("[^0-9]", ""));
            long total = totalAsk + totalBid;

            if (total == 0)
                return 0.5;
            return (double) totalBid / total;
        } catch (Exception e) {
            return 0.5;
        }
    }

    public boolean isBuyDominant() {
        return getImbalanceRatio() > 0.6;
    }

    public boolean isSellDominant() {
        return getImbalanceRatio() < 0.4;
    }
}
