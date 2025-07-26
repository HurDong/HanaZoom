package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.StockTickerDto;

import java.util.List;

public interface StockService {
    List<StockTickerDto> getStockTickerData();
}