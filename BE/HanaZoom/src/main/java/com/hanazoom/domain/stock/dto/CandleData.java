package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 캔들스틱 차트 데이터 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandleData {
    
    private String stockCode;           // 종목코드
    private LocalDateTime dateTime;     // 날짜/시간
    private String timeframe;           // 시간봉 (1M, 5M, 15M, 1H, 1D, 1W, 1MO)
    
    // OHLCV 데이터
    private String openPrice;           // 시가
    private String highPrice;           // 고가
    private String lowPrice;            // 저가
    private String closePrice;          // 종가
    private String volume;              // 거래량
    
    // 추가 정보
    private String changePrice;         // 전일대비
    private String changeRate;          // 등락률
    private String changeSign;          // 등락구분
    
    private boolean isComplete;         // 캔들 완성 여부 (현재봉은 false)
    private long timestamp;             // 타임스탬프
    
    /**
     * 실시간 데이터로 현재 캔들 업데이트
     */
    public void updateWithRealtime(String currentPrice, String volume) {
        this.closePrice = currentPrice;
        this.volume = volume;
        
        // 고가/저가 업데이트
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
        this.isComplete = false; // 현재 진행 중인 캔들
    }
    
    /**
     * 캔들 완성 처리
     */
    public void complete() {
        this.isComplete = true;
    }
}
