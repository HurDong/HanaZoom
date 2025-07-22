package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.StockTickerDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Random random = new Random();

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
                    String price;
                    String change;
                    try {
                        String key = "stock:price:" + stock.getSymbol();
                        price = (String) redisTemplate.opsForValue().get(key);

                        if (price == null) {
                            // Redis에 데이터가 없을 경우 임시 데이터 생성
                            price = String.valueOf(50000 + random.nextInt(10000));
                            redisTemplate.opsForValue().set(key, price);
                        }

                        // 임시로 -3% ~ +3% 사이의 등락률 생성
                        double changeValue = -3.0 + random.nextDouble() * 6.0;
                        change = String.format("%+.2f%%", changeValue);
                    } catch (Exception e) {
                        log.warn("Redis 연결 실패. 기본 데이터를 사용합니다. Error: {}", e.getMessage());
                        // Redis 연결 실패 시 임시 데이터 사용
                        price = String.valueOf(50000 + random.nextInt(10000));
                        double changeValue = -3.0 + random.nextDouble() * 6.0;
                        change = String.format("%+.2f%%", changeValue);
                    }

                    return StockTickerDto.builder()
                            .symbol(stock.getSymbol())
                            .name(stock.getName())
                            .price(price)
                            .change(change)
                            .emoji(stock.getEmoji())
                            .build();
                })
                .collect(Collectors.toList());
    }
}