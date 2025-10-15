package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.CandleData;

import java.util.List;

public interface StockChartService {
    
    List<CandleData> getChartData(String stockCode, String timeframe, int limit);
    
    CandleData getCurrentCandle(String stockCode, String timeframe);
    
    void updateCurrentCandle(String stockCode, String currentPrice, String volume);
    
    void createNewCandle(String stockCode, String timeframe, String openPrice);
}
