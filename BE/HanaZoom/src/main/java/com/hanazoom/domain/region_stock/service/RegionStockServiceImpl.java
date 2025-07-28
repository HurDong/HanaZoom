package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region_stock.dto.RegionStatsResponse;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.region_stock.repository.RegionStockRepository;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionStockServiceImpl implements RegionStockService {

        private final RegionStockRepository regionStockRepository;
        private final RegionRepository regionRepository;

        @Override
        public RegionStatsResponse getRegionStats(Long regionId) {
                // 1. 지역 정보 조회
                Region region = regionRepository.findById(regionId)
                                .orElseThrow(() -> new IllegalArgumentException("지역을 찾을 수 없습니다."));

                // 2. 오늘 날짜 기준으로 통계 데이터 조회
                LocalDate today = LocalDate.now();
                RegionStockRepository.RegionStockStats stats = regionStockRepository.getRegionStatsForDate(regionId,
                                today);

                // 3. 인기도 점수 기준으로 상위 5개 주식 정보 조회
                List<RegionStock> trendingStocks = regionStockRepository
                                .findTop5ByRegionIdAndDataDateOrderByPopularityScoreDesc(
                                                regionId,
                                                today,
                                                PageRequest.of(0, 5));

                log.debug("Found {} trending stocks for region {}", trendingStocks.size(), regionId);

                // 4. 응답 DTO 생성
                return RegionStatsResponse.builder()
                                .regionId(regionId)
                                .name(region.getName())
                                .stats(RegionStatsResponse.Stats.builder()
                                                .todayPostCount(stats.getPostCount())
                                                .todayCommentCount(stats.getCommentCount())
                                                .todayTotalViews(stats.getViewCount())
                                                .build())
                                .trendingStocks(trendingStocks.stream()
                                                .map(rs -> RegionStatsResponse.TrendingStock.builder()
                                                                .symbol(rs.getStock().getSymbol())
                                                                .name(rs.getStock().getName())
                                                                .regionalRanking(rs.getRegionalRanking())
                                                                .popularityScore(rs.getPopularityScore())
                                                                .trendScore(rs.getTrendScore())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .build();
        }

        @Override
        @Transactional
        public void updateRegionStocks() {
                log.info("Updating region stocks...");
                // 구현 예정
        }

        @Override
        public void getCurrentRegionStocks() {
                log.info("Getting current region stocks...");
                // 구현 예정
        }
}