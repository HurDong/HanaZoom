package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBookItem {

    private String price; 
    private String quantity; 
    private String orderCount; 
    private String orderType; 
    private int rank; 

    public long getPriceAsLong() {
        try {
            return Long.parseLong(price.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0L;
        }
    }

    public long getQuantityAsLong() {
        try {
            return Long.parseLong(quantity.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0L;
        }
    }

    public int getOrderCountAsInt() {
        try {
            return Integer.parseInt(orderCount.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }
}
