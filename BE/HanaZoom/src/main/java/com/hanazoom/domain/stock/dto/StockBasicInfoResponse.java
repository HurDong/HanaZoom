package com.hanazoom.domain.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * KIS API 종목 기본정보 조회 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockBasicInfoResponse {

    private String stockCode; // 종목코드
    private String stockName; // 종목명
    private String marketName; // 시장명 (KOSPI, KOSDAQ 등)
    private String sector; // 업종명
    private String listingShares; // 상장주식수
    private String faceValue; // 액면가
    private String capital; // 자본금
    private String listingDate; // 상장일
    private String ceoName; // 대표자명
    private String website; // 홈페이지
    private String region; // 지역
    private String closingMonth; // 결산월
    private String mainBusiness; // 주요사업
    private String per; // PER (주가수익비율)
    private String pbr; // PBR (주가순자산비율)
    private String eps; // EPS (주당순이익)
    private String bps; // BPS (주당순자산)
    private String dividend; // 배당금
    private String dividendYield; // 배당수익률

    /**
     * 상장 시장 구분 (KOSPI/KOSDAQ/KONEX)
     */
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

    /**
     * PER 값이 유효한지 확인
     */
    public boolean isPerValid() {
        try {
            double perValue = Double.parseDouble(per);
            return perValue > 0 && perValue < 1000; // 유효한 PER 범위
        } catch (NumberFormatException | NullPointerException e) {
            return false;
        }
    }

    /**
     * PBR 값이 유효한지 확인
     */
    public boolean isPbrValid() {
        try {
            double pbrValue = Double.parseDouble(pbr);
            return pbrValue > 0 && pbrValue < 100; // 유효한 PBR 범위
        } catch (NumberFormatException | NullPointerException e) {
            return false;
        }
    }
}
