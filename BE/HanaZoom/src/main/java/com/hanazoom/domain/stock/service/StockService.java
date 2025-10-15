package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.OrderBookResponse;
import com.hanazoom.domain.stock.dto.StockBasicInfoResponse;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface StockService {
    Stock getStockBySymbol(String symbol);

    List<StockTickerDto> getStockTickers();

    List<StockTickerDto> searchStocks(String query);

    StockPriceResponse getRealTimePrice(String stockCode);

    StockBasicInfoResponse getStockBasicInfo(String stockCode);

    OrderBookResponse getOrderBook(String stockCode);

    Page<StockTickerDto> getAllStocks(Pageable pageable);
}