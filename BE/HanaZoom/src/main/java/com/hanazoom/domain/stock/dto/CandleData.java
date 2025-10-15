package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandleData {
    
    private String stockCode;           
    private LocalDateTime dateTime;     
    private String timeframe;           
    

    private String openPrice;           
    private String highPrice;           
    private String lowPrice;            
    private String closePrice;          
    private String volume;              
    

    private String changePrice;         
    private String changeRate;          
    private String changeSign;          
    
    private boolean isComplete;         
    private long timestamp;             
    
    public void updateWithRealtime(String currentPrice, String volume) {
        this.closePrice = currentPrice;
        this.volume = volume;
        

        double current = Double.parseDouble(currentPrice);
        double high = Double.parseDouble(this.highPrice);
        double low = Double.parseDouble(this.lowPrice);
        
        if (current > high) {
            this.highPrice = currentPrice;
        }
        if (current < low) {
            this.lowPrice = currentPrice;
        }
        
        this.timestamp = System.currentTimeMillis();
        this.isComplete = false; 
    }
    
    public void complete() {
        this.isComplete = true;
    }
}
