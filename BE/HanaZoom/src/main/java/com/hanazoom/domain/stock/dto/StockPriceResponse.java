package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * KIS API 현재가 조회 응답 DTO (호가창 데이터 포함)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockPriceResponse {

    private String stockCode; // 종목코드
    private String stockName; // 종목명
    private String currentPrice; // 현재가
    private String changePrice; // 전일대비가격
    private String changeRate; // 전일대비등락율
    private String changeSign; // 전일대비구분 (1: 상한, 2: 상승, 3: 보합, 4: 하락, 5: 하한)
    private String openPrice; // 시가
    private String highPrice; // 고가
    private String lowPrice; // 저가
    private String volume; // 누적거래량
    private String volumeRatio; // 거래량비율
    private String marketCap; // 시가총액
    private String previousClose; // 전일종가
    private String updatedTime; // 갱신시간
    private boolean isMarketOpen; // 장 운영시간 여부
    private boolean isAfterMarketClose; // 장종료 후 여부
    private String marketStatus; // 시장 상태 메시지

    // 호가창 데이터 필드들
    private List<OrderBookItem> askOrders; // 매도호가 목록 (10단계)
    private List<OrderBookItem> bidOrders; // 매수호가 목록 (10단계)
    private String totalAskQuantity; // 총 매도잔량
    private String totalBidQuantity; // 총 매수잔량
    private double imbalanceRatio; // 매수/매도 불균형 비율
    private int spread; // 스프레드 (최우선매도 - 최우선매수)
    private boolean buyDominant; // 매수우세 여부
    private boolean sellDominant; // 매도우세 여부

    /**
     * 전일대비구분을 기반으로 상승/하락 상태 반환
     */
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

    /**
     * 변화율이 양수인지 확인
     */
    public boolean isPositiveChange() {
        return "1".equals(changeSign) || "2".equals(changeSign);
    }

    /**
     * 변화율이 음수인지 확인
     */
    public boolean isNegativeChange() {
        return "4".equals(changeSign) || "5".equals(changeSign);
    }

    /**
     * 호가창 데이터가 있는지 확인
     */
    public boolean hasOrderBookData() {
        return askOrders != null && !askOrders.isEmpty() && 
               bidOrders != null && !bidOrders.isEmpty();
    }

    /**
     * 최우선 매수호가 반환
     */
    public String getBestBidPrice() {
        return bidOrders != null && !bidOrders.isEmpty() ? bidOrders.get(0).getPrice() : "0";
    }

    /**
     * 최우선 매도호가 반환
     */
    public String getBestAskPrice() {
        return askOrders != null && !askOrders.isEmpty() ? askOrders.get(0).getPrice() : "0";
    }

    /**
     * 스프레드 계산 및 업데이트
     */
    public void calculateSpread() {
        if (hasOrderBookData()) {
            int bestAsk = Integer.parseInt(getBestAskPrice());
            int bestBid = Integer.parseInt(getBestBidPrice());
            this.spread = bestAsk - bestBid;
        }
    }

    /**
     * 매수/매도 불균형 비율 계산 및 업데이트
     */
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
