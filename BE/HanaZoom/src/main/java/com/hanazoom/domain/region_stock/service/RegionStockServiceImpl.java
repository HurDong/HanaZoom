package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.region_stock.repository.RegionStockRepository;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegionStockServiceImpl implements RegionStockService {

    private final RegionStockRepository regionStockRepository;
    private final RegionRepository regionRepository;
    private final StockRepository stockRepository;

    @Override
    @Transactional
    @Scheduled(fixedRate = 600000, initialDelay = 600000) // 서버 시작 10분 후 첫 실행, 그 후 10분마다
    public void updateRegionStocks() {
        log.info("Updating region stocks...");
        Map<Long, List<Long>> regionStockMap = readRegionStockData();
        LocalDate today = LocalDate.now();

        regionStockMap.forEach((regionId, stockIds) -> {
            Region region = regionRepository.findById(regionId)
                    .orElseThrow(() -> new IllegalStateException("Region not found: " + regionId));

            // 5개 중 3개 랜덤 선택
            Collections.shuffle(stockIds);
            List<Long> selectedStockIds = stockIds.subList(0, Math.min(3, stockIds.size()));

            // 기존 데이터 조회 또는 새로 생성
            for (int i = 0; i < selectedStockIds.size(); i++) {
                Long stockId = selectedStockIds.get(i);
                Stock stock = stockRepository.findById(stockId)
                        .orElseThrow(() -> new IllegalStateException("Stock not found: " + stockId));

                final int ranking = i + 1;
                // 기존 RegionStock 조회
                RegionStock regionStock = regionStockRepository.findByRegionAndStock(region, stock)
                        .orElseGet(() -> RegionStock.builder()
                                .region(region)
                                .stock(stock)
                                .dataDate(today)
                                .regionalRanking(ranking)
                                .popularityScore(BigDecimal.ZERO)
                                .trendScore(BigDecimal.ZERO)
                                .build());

                // popularityScore 증가
                regionStock.increasePopularityScore();

                // 순위 업데이트
                regionStock.updateRegionalRanking(ranking);

                // 저장
                regionStockRepository.save(regionStock);
            }
        });

        log.info("Region stocks updated successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegionStock> getCurrentRegionStocks() {
        return regionStockRepository.findAllByDataDate(LocalDate.now());
    }

    private Map<Long, List<Long>> readRegionStockData() {
        Map<Long, List<Long>> regionStockMap = new HashMap<>();
        ClassPathResource resource = new ClassPathResource("data/region/recommended_stocks_by_region.csv");

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            // Skip header
            br.readLine();

            String line;
            while ((line = br.readLine()) != null) {
                try {
                    final String currentLine = line; // line 변수를 final로 만들기 위해 새로운 변수 생성
                    String[] columns = currentLine.split(",");
                    if (columns.length >= 10 && !"국장".equals(columns[2])) {
                        continue;
                    }

                    String regionIdStr = columns[8].trim();
                    if (regionIdStr.isEmpty()) {
                        log.warn("Empty region ID found in line: {}", currentLine);
                        continue;
                    }

                    Long regionId = Long.parseLong(regionIdStr);
                    String stockIdsStr = columns[9].replaceAll("[\\[\\]\"]", "");

                    List<Long> stockIds = Arrays.stream(stockIdsStr.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty()) // 빈 문자열 필터링
                            .map(s -> {
                                try {
                                    return Long.parseLong(s);
                                } catch (NumberFormatException e) {
                                    log.warn("Invalid stock ID found: {} in line: {}", s, currentLine);
                                    return null;
                                }
                            })
                            .filter(Objects::nonNull) // null 값 필터링
                            .collect(Collectors.toList());

                    if (!stockIds.isEmpty()) {
                        regionStockMap.put(regionId, stockIds);
                    }
                } catch (Exception e) {
                    log.error("Error processing line: {}", line, e);
                }
            }
        } catch (IOException e) {
            log.error("Error reading region stock data", e);
            throw new RuntimeException("Failed to read region stock data", e);
        }

        return regionStockMap;
    }
}