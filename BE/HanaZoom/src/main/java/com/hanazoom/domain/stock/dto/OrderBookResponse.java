package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import com.hanazoom.domain.stock.dto.OrderBookItem;

/**
 * KIS API 호가창 정보 조회 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBookResponse {

    private String stockCode; // 종목코드
    private String stockName; // 종목명
    private String currentPrice; // 현재가
    private String updatedTime; // 갱신시간

    private List<OrderBookItem> askOrders; // 매도 호가 (상위 10단계)
    private List<OrderBookItem> bidOrders; // 매수 호가 (상위 10단계)

    private String totalAskQuantity; // 매도 총잔량
    private String totalBidQuantity; // 매수 총잔량



    /**
     * 매수/매도 호가 차이 (스프레드) 계산
     */
    public long getSpread() {
        if (askOrders.isEmpty() || bidOrders.isEmpty())
            return 0;

        long bestAsk = askOrders.get(0).getPriceAsLong(); // 최우선 매도호가
        long bestBid = bidOrders.get(0).getPriceAsLong(); // 최우선 매수호가

        return bestAsk - bestBid;
    }

    /**
     * 호가창 불균형 비율 계산 (매수잔량 / 전체잔량)
     */
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

    /**
     * 매수 우세인지 확인
     */
    public boolean isBuyDominant() {
        return getImbalanceRatio() > 0.6;
    }

    /**
     * 매도 우세인지 확인
     */
    public boolean isSellDominant() {
        return getImbalanceRatio() < 0.4;
    }
}
