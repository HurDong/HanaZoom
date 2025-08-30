package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 호가창 개별 호가 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBookItem {

    private String price; // 호가
    private String quantity; // 잔량
    private String orderCount; // 주문건수
    private String orderType; // 주문유형 (매수/매도)
    private int rank; // 호가 순위 (1~10)

    /**
     * 호가를 long 타입으로 변환
     */
    public long getPriceAsLong() {
        try {
            return Long.parseLong(price.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0L;
        }
    }

    /**
     * 잔량을 long 타입으로 변환
     */
    public long getQuantityAsLong() {
        try {
            return Long.parseLong(quantity.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0L;
        }
    }

    /**
     * 주문건수를 int 타입으로 변환
     */
    public int getOrderCountAsInt() {
        try {
            return Integer.parseInt(orderCount.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }
}
