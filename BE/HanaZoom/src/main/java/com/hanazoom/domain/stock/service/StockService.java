package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import java.util.List;

public interface StockService {
    Stock getStockBySymbol(String symbol);

    List<StockTickerDto> getStockTickers();
}