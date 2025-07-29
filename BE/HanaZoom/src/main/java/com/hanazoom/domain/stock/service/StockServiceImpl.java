package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;

    @Override
    @Transactional(readOnly = true)
    public Stock getStockBySymbol(String symbol) {
        return stockRepository.findBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("주식을 찾을 수 없습니다."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockTickerDto> getStockTickers() {
        return stockRepository.findAll().stream()
                .map(stock -> StockTickerDto.builder()
                        .symbol(stock.getSymbol())
                        .name(stock.getName())
                        .price(String.valueOf(stock.getCurrentPrice()))
                        .change(String.format("%.2f%%", stock.getPriceChangePercent()))
                        .emoji(stock.getEmoji())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockTickerDto> searchStocks(String query) {
        return stockRepository.findByNameContainingOrSymbolContaining(query, query).stream()
                .limit(10)
                .map(stock -> StockTickerDto.builder()
                        .symbol(stock.getSymbol())
                        .name(stock.getName())
                        .price(String.valueOf(stock.getCurrentPrice()))
                        .change(String.format("%.2f%%", stock.getPriceChangePercent()))
                        .emoji(stock.getEmoji())
                        .build())
                .collect(Collectors.toList());
    }
}