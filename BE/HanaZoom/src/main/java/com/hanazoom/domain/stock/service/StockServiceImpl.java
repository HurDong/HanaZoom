package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.StockTickerDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final RedisTemplate<String, Object> redisTemplate;

    // TODO: DB에서 관리하도록 수정 필요
    private static final List<StockTickerDto> subscribedStocks = Arrays.asList(
            StockTickerDto.builder().symbol("005930").name("삼성전자").emoji("🤖").build(),
            StockTickerDto.builder().symbol("035420").name("NAVER").emoji("✅").build(),
            StockTickerDto.builder().symbol("035720").name("카카오").emoji("💬").build(),
            StockTickerDto.builder().symbol("000660").name("SK하이닉스").emoji("✨").build(),
            StockTickerDto.builder().symbol("034020").name("두산에너빌리티").emoji("⚡️").build(),
            StockTickerDto.builder().symbol("042660").name("한화오션").emoji("⚓️").build(),
            StockTickerDto.builder().symbol("086790").name("하나금융지주").emoji("💰").build());

    @Override
    public List<StockTickerDto> getStockTickerData() {
        return subscribedStocks.stream()
                .map(stock -> {
                    String key = "stock:price:" + stock.getSymbol();
                    String price = (String) redisTemplate.opsForValue().get(key);

                    return StockTickerDto.builder()
                            .symbol(stock.getSymbol())
                            .name(stock.getName())
                            .price(Objects.requireNonNullElse(price, "0")) // Redis에 값이 없으면 "0" 반환
                            .change("+0.00%") // TODO: 등락률 계산 로직 추가 필요
                            .emoji(stock.getEmoji())
                            .build();
                })
                .collect(Collectors.toList());
    }
}