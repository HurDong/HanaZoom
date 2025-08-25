package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.CandleData;

import java.util.List;

public interface StockChartService {
    
    /**
     * 과거 캔들 데이터 조회
     * 
     * @param stockCode 종목코드
     * @param timeframe 시간봉 (1M, 5M, 15M, 1H, 1D, 1W, 1MO)
     * @param limit 조회할 캔들 수
     * @return 캔들 데이터 리스트
     */
    List<CandleData> getChartData(String stockCode, String timeframe, int limit);
    
    /**
     * 현재 진행 중인 캔들 조회
     * 
     * @param stockCode 종목코드
     * @param timeframe 시간봉
     * @return 현재 캔들 데이터
     */
    CandleData getCurrentCandle(String stockCode, String timeframe);
    
    /**
     * 실시간 데이터로 현재 캔들 업데이트
     * 
     * @param stockCode 종목코드
     * @param currentPrice 현재가
     * @param volume 거래량
     */
    void updateCurrentCandle(String stockCode, String currentPrice, String volume);
    
    /**
     * 새로운 캔들 생성 (시간봉 전환 시)
     * 
     * @param stockCode 종목코드
     * @param timeframe 시간봉
     * @param openPrice 시가
     */
    void createNewCandle(String stockCode, String timeframe, String openPrice);
}
