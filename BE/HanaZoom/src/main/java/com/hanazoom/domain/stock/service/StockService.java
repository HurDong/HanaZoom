package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import java.util.List;

public interface StockService {
    Stock getStockBySymbol(String symbol);

    List<StockTickerDto> getStockTickers();

    List<StockTickerDto> searchStocks(String query);

    /**
     * KIS API를 통한 실시간 현재가 조회
     * 
     * @param stockCode 종목코드 (6자리)
     * @return 현재가 정보
     */
    StockPriceResponse getRealTimePrice(String stockCode);

    /**
     * KIS API를 통한 종목 기본정보 조회
     * 
     * @param stockCode 종목코드 (6자리)
     * @return 종목 기본정보
     */
    StockBasicInfoResponse getStockBasicInfo(String stockCode);

    /**
     * KIS API를 통한 호가창 정보 조회
     * 
     * @param stockCode 종목코드 (6자리)
     * @return 호가창 정보
     */
    OrderBookResponse getOrderBook(String stockCode);
}