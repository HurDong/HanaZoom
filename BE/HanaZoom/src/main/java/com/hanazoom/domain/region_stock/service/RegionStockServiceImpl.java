package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.stock.entity.Stock;
import jakarta.transaction.Transactional;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RegionStockServiceImpl implements RegionStockService {

    private final JdbcTemplate jdbcTemplate;

    public RegionStockServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Scheduled(fixedRate = 600000) // 10분(600,000ms)마다 실행
    @Transactional
    public void updateRegionStocks() {
        // 1. 기존 데이터 삭제
        deleteAllRegionStocks();

        // 2. CSV 파일에서 데이터 읽기
        Map<Long, List<Long>> regionStockMap = readRegionStockDataFromCsv();

        // 3. 각 지역별로 3개의 주식 랜덤 선택 후 저장
        List<RegionStock> newRegionStocks = new ArrayList<>();

        regionStockMap.forEach((regionId, stockIds) -> {
            // 5개 중 3개 랜덤 선택
            Collections.shuffle(stockIds);
            List<Long> selectedStockIds = stockIds.subList(0, Math.min(3, stockIds.size()));

            selectedStockIds.forEach(stockId -> {
                RegionStock regionStock = RegionStock.builder()
                        .region(Region.builder().id(regionId).build())
                        .stock(Stock.builder().id(stockId).build())
                        .build();
                newRegionStocks.add(regionStock);
            });
        });

        // 4. 새로운 데이터 저장
        saveRegionStocks(newRegionStocks);
    }

    @Override
    @Transactional
    public void saveRegionStocks(List<RegionStock> regionStocks) {
        String sql = "INSERT INTO region_stock (region_id, stock_id) VALUES (?, ?)";

        List<Object[]> batchArgs = regionStocks.stream()
                .map(rs -> new Object[] {
                        rs.getRegion().getId(),
                        rs.getStock().getId()
                })
                .collect(Collectors.toList());

        jdbcTemplate.batchUpdate(sql, batchArgs);
    }

    @Override
    @Transactional
    public void deleteAllRegionStocks() {
        String sql = "DELETE FROM region_stock";
        jdbcTemplate.update(sql);
    }

    private Map<Long, List<Long>> readRegionStockDataFromCsv() {
        Map<Long, List<Long>> regionStockMap = new HashMap<>();

        try {
            ClassPathResource resource = new ClassPathResource("data/region/recommended_stocks_by_region.csv");
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

                // 헤더 건너뛰기
                br.readLine();

                String line;
                while ((line = br.readLine()) != null) {
                    String[] values = line.split(",");
                    if (values.length >= 2) {
                        Long regionId = Long.parseLong(values[0].trim());
                        Long stockId = Long.parseLong(values[1].trim());

                        regionStockMap.computeIfAbsent(regionId, k -> new ArrayList<>())
                                .add(stockId);
                    }
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("CSV 파일 읽기 실패", e);
        }

        return regionStockMap;
    }
}