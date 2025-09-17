package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region.entity.RegionType;
import com.hanazoom.domain.region_stock.dto.RegionStatsResponse;
import com.hanazoom.domain.region_stock.dto.PopularityDetailsResponse;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.region_stock.repository.RegionStockRepository;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import com.hanazoom.domain.community.repository.PostRepository;
import com.hanazoom.domain.community.repository.CommentRepository;
import com.hanazoom.domain.community.repository.PollRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionStockServiceImpl implements RegionStockService {

        private final RegionStockRepository regionStockRepository;
        private final RegionRepository regionRepository;
        private final StockRepository stockRepository;
        private final PostRepository postRepository;
        private final CommentRepository commentRepository;
        private final PollRepository pollRepository;

        // 캐싱을 위한 필드
        private Map<Long, Set<Long>> existingStockCache = new HashMap<>();
        private LocalDate lastCacheUpdate = null;
        private Map<Long, List<Long>> csvDataCache = new HashMap<>();
        private LocalDate lastCsvCacheUpdate = null;

        // 캐시 업데이트 메서드
        private void updateCache() {
                LocalDate today = LocalDate.now();
                if (lastCacheUpdate == null || !lastCacheUpdate.equals(today)) {
                        // 모든 지역의 기존 주식 정보를 한 번에 조회
                        List<RegionStock> allExistingStocks = regionStockRepository.findAll();

                        existingStockCache.clear();
                        for (RegionStock rs : allExistingStocks) {
                                Long regionId = rs.getRegion().getId();
                                Long stockId = rs.getStock().getId();

                                existingStockCache.computeIfAbsent(regionId, k -> new HashSet<>()).add(stockId);
                        }

                        lastCacheUpdate = today;
                }
        }

        // CSV 데이터 캐싱 메서드
        private void updateCsvCache() {
                LocalDate today = LocalDate.now();
                if (lastCsvCacheUpdate == null || !lastCsvCacheUpdate.equals(today)) {
                        try {
                                Resource resource = new ClassPathResource(
                                        "data/region/recommended_stocks_by_region.csv");
                                BufferedReader reader = new BufferedReader(
                                                new InputStreamReader(resource.getInputStream(),
                                                                StandardCharsets.UTF_8));

                                String line;
                                boolean isFirstLine = true;
                                csvDataCache.clear();

                                while ((line = reader.readLine()) != null) {
                                        if (isFirstLine) {
                                                isFirstLine = false;
                                                continue;
                                        }

                                        String[] columns = line.split(",");
                                        if (columns.length < 10)
                                                continue;

                                        String regionIdStr = columns[8];
                                        String stockIdsStr = "";

                                        if (columns.length >= 10) {
                                                StringBuilder stockIdsBuilder = new StringBuilder();
                                                for (int i = 9; i < columns.length; i++) {
                                                        stockIdsBuilder.append(columns[i]);
                                                        if (i < columns.length - 1) {
                                                                stockIdsBuilder.append(",");
                                                        }
                                                }
                                                stockIdsStr = stockIdsBuilder.toString();

                                                if (stockIdsStr.startsWith("\"") && stockIdsStr.endsWith("\"")) {
                                                        stockIdsStr = stockIdsStr.substring(1,
                                                                        stockIdsStr.length() - 1);
                                                }
                                        }

                                        try {
                                                Long regionId = Long.parseLong(regionIdStr);
                                                List<Long> stockIds = parseStockIds(stockIdsStr);

                                                if (!stockIds.isEmpty()) {
                                                        csvDataCache.put(regionId, stockIds);
                                                }
                                        } catch (NumberFormatException e) {
                                                continue;
                                        }
                                }

                                reader.close();
                                lastCsvCacheUpdate = today;

                        } catch (IOException e) {
                                log.error("CSV 캐시 업데이트 실패", e);
                        }
                }
        }

        @Override
        public PopularityDetailsResponse getPopularityDetails(Long regionId, String symbol, String date) {
                log.info("🔍 인기도 상세 조회 시작 - regionId: {}, symbol: {}, date: {}", regionId, symbol, date);
                
                // 기본 파라미터 처리: date = "latest" 또는 yyyy-MM-dd
                LocalDate targetDate;
                if (date == null || date.isBlank() || "latest".equalsIgnoreCase(date)) {
                        targetDate = regionStockRepository.findLatestDataDateByRegionId(regionId);
                        if (targetDate == null) {
                                targetDate = LocalDate.now();
                                log.warn("⚠️ 지역 {}의 최신 데이터 날짜가 없어서 오늘 날짜 사용: {}", regionId, targetDate);
                        } else {
                                log.info("📅 지역 {}의 최신 데이터 날짜: {}", regionId, targetDate);
                        }
                } else {
                        targetDate = LocalDate.parse(date);
                        log.info("📅 요청된 날짜 사용: {}", targetDate);
                }

                Stock stock = stockRepository.findBySymbol(symbol)
                                .orElseThrow(() -> new IllegalArgumentException("종목을 찾을 수 없습니다: " + symbol));
                log.info("📊 종목 정보 - ID: {}, Symbol: {}, Name: {}", stock.getId(), stock.getSymbol(), stock.getName());

                // 해당 지역-종목-날짜의 RegionStock 데이터 조회
                RegionStock regionStock = regionStockRepository.findByRegionIdAndStockIdAndDataDate(regionId, stock.getId(), targetDate);
                if (regionStock != null) {
                        log.info("✅ RegionStock 데이터 발견 - popularityScore: {}, regionalRanking: {}, trendScore: {}", 
                                regionStock.getPopularityScore(), regionStock.getRegionalRanking(), regionStock.getTrendScore());
                } else {
                        log.warn("⚠️ RegionStock 데이터 없음 - regionId: {}, stockId: {}, date: {}", regionId, stock.getId(), targetDate);
                        
                        // 다른 날짜 데이터가 있는지 확인
                        List<RegionStock> allRegionStocks = regionStockRepository.findByRegionIdAndStockId(regionId, stock.getId());
                        if (!allRegionStocks.isEmpty()) {
                                log.info("📋 해당 지역-종목의 다른 날짜 데이터 {}개 발견:", allRegionStocks.size());
                                for (RegionStock rs : allRegionStocks) {
                                        log.info("  - 날짜: {}, 점수: {}, 순위: {}", rs.getDataDate(), rs.getPopularityScore(), rs.getRegionalRanking());
                                }
                        } else {
                                log.warn("❌ 해당 지역-종목의 데이터가 전혀 없음");
                        }
                }

                // 실제 RegionStock 데이터가 있으면 해당 값들을 사용, 없으면 0으로 반환
                BigDecimal actualScore = regionStock != null ? regionStock.getPopularityScore() : BigDecimal.ZERO;
                BigDecimal actualTrend = regionStock != null ? regionStock.getTrendScore() : BigDecimal.ZERO;
                
                // 순위 데이터 정합성 수정 (0인 경우 1로 설정)
                int actualRanking = regionStock != null ? regionStock.getRegionalRanking() : 1;
                if (actualRanking == 0) {
                    actualRanking = 1;
                }
                
                // 커뮤니티 지표 계산 (실제 테이블에서 조회)
                int postCount = postRepository.countByStockId(stock.getId());
                int commentCount = commentRepository.countByStockId(stock.getId());
                int voteCount = pollRepository.countByStockId(stock.getId());
                int viewCount = postRepository.sumViewCountByStockId(stock.getId());
                int searchCount = regionStock != null ? regionStock.getSearchCount() : 0;
                int newsMentionCount = regionStock != null ? regionStock.getNewsMentionCount() : 0;
                
                // 커뮤니티 데이터 디버깅 로그
                log.info("📊 [커뮤니티 데이터] regionId: {}, symbol: {}, postCount: {}, commentCount: {}, voteCount: {}, viewCount: {}, searchCount: {}", 
                        regionId, symbol, postCount, commentCount, voteCount, viewCount, searchCount);
                
                // 실제 커뮤니티 데이터가 있는지 확인
                if (postCount > 0 || commentCount > 0 || voteCount > 0 || viewCount > 0) {
                    log.info("✅ [커뮤니티 데이터] 실제 데이터 발견 - postCount: {}, commentCount: {}, voteCount: {}, viewCount: {}", 
                            postCount, commentCount, voteCount, viewCount);
                } else {
                    log.warn("⚠️ [커뮤니티 데이터] 모든 값이 0 - regionId: {}, symbol: {}", regionId, symbol);
                }
                
                // 커뮤니티 점수 계산 (0~100 스케일)
                BigDecimal communityScore = calculateCommunityScore(postCount, commentCount, voteCount, viewCount, searchCount);
                
                // 모멘텀 점수 계산 (0~100 스케일)
                BigDecimal momentumScore = calculateMomentumScore(actualTrend, searchCount, newsMentionCount);
                
                // 뉴스 영향도 점수 계산 (0~100 스케일)
                BigDecimal newsImpactScore = calculateNewsImpactScore(newsMentionCount);
                
                // 가중치 기반 최종 점수 계산
                BigDecimal finalScore = calculateFinalScore(actualScore, communityScore, momentumScore, newsImpactScore);
                
                PopularityDetailsResponse response = PopularityDetailsResponse.builder()
                                .regionId(regionId)
                                .symbol(symbol)
                                .date(targetDate)
                                .score(finalScore) // 0~100 스케일
                                .tradeTrend(actualScore) // 0~100 스케일 (기존 popularityScore)
                                .community(communityScore) // 0~100 스케일
                                .momentum(momentumScore) // 0~100 스케일
                                .newsImpact(newsImpactScore) // 0~100 스케일
                                .weightTradeTrend(new BigDecimal("0.45"))
                                .weightCommunity(new BigDecimal("0.35"))
                                .weightMomentum(new BigDecimal("0.20"))
                                .weightNews(new BigDecimal("0.00")) // 현재 미사용
                                .postCount(postCount)
                                .commentCount(commentCount)
                                .voteCount(voteCount)
                                .viewCount(viewCount)
                                .build();
                
                log.info("🔍 응답 데이터 - regionId: {}, symbol: {}, date: {}, finalScore: {}, tradeTrend: {}, community: {}, momentum: {}, newsImpact: {}", 
                        response.getRegionId(), response.getSymbol(), response.getDate(), 
                        response.getScore(), response.getTradeTrend(), response.getCommunity(), 
                        response.getMomentum(), response.getNewsImpact());
                
                return response;
        }

        /**
         * 커뮤니티 점수 계산 (0~100 스케일)
         * 게시글, 댓글, 투표, 조회수, 검색수를 종합하여 계산
         */
        private BigDecimal calculateCommunityScore(int postCount, int commentCount, int voteCount, int viewCount, int searchCount) {
                // 각 지표별 가중치
                BigDecimal postWeight = new BigDecimal("0.25");
                BigDecimal commentWeight = new BigDecimal("0.20");
                BigDecimal voteWeight = new BigDecimal("0.20");
                BigDecimal viewWeight = new BigDecimal("0.20");
                BigDecimal searchWeight = new BigDecimal("0.15");
                
                // 정규화된 점수 계산 (로그 스케일 적용)
                BigDecimal postScore = calculateLogScore(postCount, 100); // 최대 100개 기준
                BigDecimal commentScore = calculateLogScore(commentCount, 500); // 최대 500개 기준
                BigDecimal voteScore = calculateLogScore(voteCount, 200); // 최대 200개 기준
                BigDecimal viewScore = calculateLogScore(viewCount, 1000); // 최대 1000개 기준
                BigDecimal searchScore = calculateLogScore(searchCount, 300); // 최대 300개 기준
                
                // 가중 평균 계산
                BigDecimal communityScore = postScore.multiply(postWeight)
                                .add(commentScore.multiply(commentWeight))
                                .add(voteScore.multiply(voteWeight))
                                .add(viewScore.multiply(viewWeight))
                                .add(searchScore.multiply(searchWeight));
                
                return communityScore.setScale(2, RoundingMode.HALF_UP);
        }

        /**
         * 모멘텀 점수 계산 (0~100 스케일)
         * 트렌드 점수, 검색수, 뉴스 언급수를 종합하여 계산
         */
        private BigDecimal calculateMomentumScore(BigDecimal trendScore, int searchCount, int newsMentionCount) {
                // 트렌드 점수 (이미 0~100 스케일)
                BigDecimal trendComponent = trendScore;
                
                // 검색 모멘텀 (최근 검색 증가율)
                BigDecimal searchComponent = calculateLogScore(searchCount, 200).multiply(new BigDecimal("0.6"));
                
                // 뉴스 모멘텀
                BigDecimal newsComponent = calculateLogScore(newsMentionCount, 50).multiply(new BigDecimal("0.4"));
                
                // 가중 평균
                BigDecimal momentumScore = trendComponent.multiply(new BigDecimal("0.5"))
                                .add(searchComponent)
                                .add(newsComponent);
                
                return momentumScore.setScale(2, RoundingMode.HALF_UP);
        }

        /**
         * 뉴스 영향도 점수 계산 (0~100 스케일)
         */
        private BigDecimal calculateNewsImpactScore(int newsMentionCount) {
                return calculateLogScore(newsMentionCount, 100); // 최대 100개 기준
        }

        /**
         * 가중치 기반 최종 점수 계산
         */
        private BigDecimal calculateFinalScore(BigDecimal tradeTrend, BigDecimal community, BigDecimal momentum, BigDecimal newsImpact) {
                BigDecimal weightTradeTrend = new BigDecimal("0.45");
                BigDecimal weightCommunity = new BigDecimal("0.35");
                BigDecimal weightMomentum = new BigDecimal("0.20");
                BigDecimal weightNews = new BigDecimal("0.00"); // 현재 미사용
                
                BigDecimal finalScore = tradeTrend.multiply(weightTradeTrend)
                                .add(community.multiply(weightCommunity))
                                .add(momentum.multiply(weightMomentum))
                                .add(newsImpact.multiply(weightNews));
                
                return finalScore.setScale(2, RoundingMode.HALF_UP);
        }

        /**
         * 로그 스케일 점수 계산 (0~100 스케일)
         * 입력값이 0이면 0, 최대값에 도달하면 100
         */
        private BigDecimal calculateLogScore(int value, int maxValue) {
                if (value <= 0) {
                        return BigDecimal.ZERO;
                }
                if (value >= maxValue) {
                        return new BigDecimal("100");
                }
                
                // 로그 스케일: log(1 + value) / log(1 + maxValue) * 100
                double logValue = Math.log(1 + value);
                double logMax = Math.log(1 + maxValue);
                double ratio = logValue / logMax;
                
                return new BigDecimal(ratio * 100).setScale(2, RoundingMode.HALF_UP);
        }

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

                // 트렌딩 주식 개수는 로그에서 제외

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
        @Scheduled(initialDelay = 3000, fixedRate = 600000) // 서버 시작 3초 후 첫 실행, 이후 10분마다
        public void updateRegionStocks() {
                log.info("지역별 주식 인기도 업데이트 시작...");

                try {
                        // CSV 캐시 업데이트
                        updateCsvCache();

                        Map<Long, List<Long>> regionStockMap = new HashMap<>();

                        // 캐시된 CSV 데이터 사용
                        for (Map.Entry<Long, List<Long>> entry : csvDataCache.entrySet()) {
                                Long regionId = entry.getKey();
                                List<Long> stockIds = entry.getValue();

                                if (!stockIds.isEmpty()) {
                                        // 기존에 선택된 주식들을 제외하고 새로운 3개 선택
                                        List<Long> selectedStockIds = selectNewRandomStocks(regionId, stockIds, 3);

                                        // 배치 처리를 위해 맵에 추가
                                        regionStockMap.put(regionId, selectedStockIds);
                                }
                        }

                        // 배치 처리로 한 번에 업데이트
                        if (!regionStockMap.isEmpty()) {
                                updatePopularityScoresBatch(regionStockMap);
                        }

                        // 상위 지역 집계 (읍/면/동 -> 구/군 -> 시/도)
                        aggregateRegionStocksUpwards(LocalDate.now());

                        log.info("지역별 주식 인기도 업데이트 완료");

                } catch (Exception e) {
                        log.error("지역별 주식 인기도 업데이트 실패", e);
                }
        }

        @Override
        public void getCurrentRegionStocks() {
                log.info("Getting current region stocks...");
                // 구현 예정
        }

        /**
         * 하위 지역들의 데이터를 상위 지역으로 집계합니다.
         * 1) NEIGHBORHOOD -> DISTRICT 집계
         * 2) DISTRICT -> CITY 집계
         */
        private void aggregateRegionStocksUpwards(LocalDate targetDate) {
                log.info("=== 상위 지역 집계 시작: targetDate={}", targetDate);
                try {
                        // 1) 구/군 단위 집계: 하위 읍/면/동 자식들의 데이터를 모읍니다
                        List<Region> allRegions = regionRepository.findAll();

                        Map<Long, Region> regionIdToRegion = allRegions.stream()
                                        .collect(Collectors.toMap(Region::getId, r -> r));

                        List<Region> districts = allRegions.stream()
                                        .filter(r -> r.getType() == RegionType.DISTRICT)
                                        .collect(Collectors.toList());

                        for (Region district : districts) {
                                List<Region> neighborhoods = allRegions.stream()
                                                .filter(r -> r.getParent() != null
                                                                && r.getParent().getId() != null
                                                                && district.getId() != null
                                                                && r.getParent().getId().equals(district.getId())
                                                                && r.getType() == RegionType.NEIGHBORHOOD)
                                                .collect(Collectors.toList());

                                if (neighborhoods.isEmpty()) {
                                        log.warn("구/군 '{}'에 하위 읍/면/동이 없습니다.", district.getName());
                                        continue;
                                }
                                aggregateForParentFromChildren(district, neighborhoods, targetDate);
                        }

                        // 2) 시/도 단위 집계: 하위 구/군 자식들의 데이터를 모읍니다
                        List<Region> cities = allRegions.stream()
                                        .filter(r -> r.getType() == RegionType.CITY)
                                        .collect(Collectors.toList());

                        for (Region city : cities) {
                                List<Region> childDistricts = allRegions.stream()
                                                .filter(r -> r.getParent() != null
                                                                && r.getParent().getId() != null
                                                                && city.getId() != null
                                                                && r.getParent().getId().equals(city.getId())
                                                                && r.getType() == RegionType.DISTRICT)
                                                .collect(Collectors.toList());

                                if (childDistricts.isEmpty()) {
                                        log.warn("시/도 '{}'에 하위 구/군이 없습니다.", city.getName());
                                        continue;
                                }
                                aggregateForParentFromChildren(city, childDistricts, targetDate);
                        }
                        log.info("=== 상위 지역 집계 완료");
                } catch (Exception e) {
                        log.error("상위 지역 집계 실패", e);
                }
        }

        /**
         * 주어진 부모 지역에 대해, 자식 지역들의 같은 날짜 데이터를 종목별로 합산하여 저장합니다.
         */
        private void aggregateForParentFromChildren(Region parentRegion, List<Region> childRegions,
                        LocalDate targetDate) {

                List<Long> childIds = childRegions.stream().map(Region::getId).collect(Collectors.toList());

                // 자식 지역들의 해당 날짜 데이터 조회
                List<RegionStock> childStocks = regionStockRepository.findByRegion_IdInAndDataDate(childIds,
                                targetDate);

                if (childStocks.isEmpty()) {
                        log.warn("부모 지역 '{}'의 자식 지역들에 주식 데이터가 없습니다.", parentRegion.getName());
                        return;
                }

                // 종목별 합산 집계
                Map<Long, BigDecimal> stockIdToPopularity = new HashMap<>();
                Map<Long, Stock> stockIdToStock = new HashMap<>();

                for (RegionStock rs : childStocks) {
                        Long stockId = rs.getStock().getId();
                        stockIdToStock.putIfAbsent(stockId, rs.getStock());
                        BigDecimal current = stockIdToPopularity.getOrDefault(stockId, BigDecimal.ZERO);
                        BigDecimal add = rs.getPopularityScore() == null ? BigDecimal.ZERO : rs.getPopularityScore();
                        stockIdToPopularity.put(stockId, current.add(add));
                }

                // 부모 지역의 기존 해당 날짜 데이터 제거 후 재생성
                regionStockRepository.deleteByRegionIdAndDataDate(parentRegion.getId(), targetDate);
                log.info("부모 지역 '{}'의 기존 데이터 삭제 완료", parentRegion.getName());

                List<RegionStock> toSave = new ArrayList<>();
                for (Map.Entry<Long, BigDecimal> entry : stockIdToPopularity.entrySet()) {
                        Long stockId = entry.getKey();
                        BigDecimal popularity = entry.getValue();
                        Stock stock = stockIdToStock.get(stockId);

                        RegionStock aggregated = RegionStock.builder()
                                        .region(parentRegion)
                                        .stock(stock)
                                        .dataDate(targetDate)
                                        .popularityScore(popularity)
                                        .regionalRanking(0)
                                        .trendScore(BigDecimal.ZERO)
                                        .build();
                        toSave.add(aggregated);
                }

                if (!toSave.isEmpty()) {
                        regionStockRepository.saveAll(toSave);
                        log.info("부모 지역 '{}'에 {}개 종목 데이터 저장 완료", parentRegion.getName(), toSave.size());
                } else {
                        log.warn("부모 지역 '{}'에 저장할 데이터가 없습니다.", parentRegion.getName());
                }
        }

        @Override
        public List<StockTickerDto> getTopStocksByRegion(Long regionId, int limit) {
                // 상세 진입 로그 제거, 필요 시 DEBUG 사용
                log.debug("getTopStocksByRegion: regionId={}, limit={}", regionId, limit);

                // 1. 지역 존재 여부 확인
                Region region = regionRepository.findById(regionId)
                                .orElseThrow(() -> new IllegalArgumentException("지역을 찾을 수 없습니다."));
                log.debug("지역 정보: id={}, name={}, type={}", region.getId(), region.getName(), region.getType());

                // 2. 해당 지역의 최신 날짜 데이터 중 인기도 점수 순으로 상위 주식 조회
                List<RegionStock> topRegionStocks = regionStockRepository
                                .findTopByRegionIdOrderByPopularityScoreDesc(
                                                regionId,
                                                PageRequest.of(0, limit));
                log.debug("조회된 RegionStock 개수: {}", topRegionStocks.size());

                if (topRegionStocks.isEmpty()) {
                        log.warn("지역 {} ({})에 대한 주식 데이터가 없습니다.", region.getName(), regionId);
                } else {
                        log.debug("조회된 주식들: {}", topRegionStocks.stream()
                                        .map(rs -> String.format("%s(%.2f)", rs.getStock().getName(),
                                                        rs.getPopularityScore()))
                                        .collect(Collectors.joining(", ")));
                }

                // 3. StockTickerDto로 변환 (실제 데이터만 사용)
                List<StockTickerDto> result = topRegionStocks.stream()
                                .map(rs -> {
                                        String sector = rs.getStock().getSector() != null ? rs.getStock().getSector()
                                                        : "기타";
                                        // 섹터 정보는 로그에서 제외

                                        return StockTickerDto.builder()
                                                        .symbol(rs.getStock().getSymbol())
                                                        .name(rs.getStock().getName())
                                                        .price(rs.getStock().getCurrentPrice() != null 
                                                                ? String.valueOf(rs.getStock().getCurrentPrice())
                                                                : null)
                                                        .change(rs.getStock().getPriceChangePercent() != null
                                                                ? String.format("%.2f", rs.getStock().getPriceChangePercent())
                                                                : "0.00")
                                                        .logoUrl(rs.getStock().getLogoUrl())
                                                        .sector(sector)
                                                        .build();
                                })
                                .collect(Collectors.toList());

                log.debug("반환할 StockTickerDto 개수: {}", result.size());
                log.debug("첫 번째 종목 정보: symbol={}, name={}, sector={}",
                                result.isEmpty() ? "없음" : result.get(0).getSymbol(),
                                result.isEmpty() ? "없음" : result.get(0).getName(),
                                result.isEmpty() ? "없음" : result.get(0).getSector());
                return result;
        }

        // JSON 배열 형태의 stock_ids를 파싱
        private List<Long> parseStockIds(String stockIdsStr) {
                List<Long> stockIds = new ArrayList<>();
                try {
                        // "[195, 196, 270, 279, 198]" 형태를 파싱
                        String cleanStr = stockIdsStr.replaceAll("[\\[\\]\"]", "");

                        if (cleanStr.isEmpty()) {
                                return stockIds;
                        }

                        String[] parts = cleanStr.split(",");

                        for (String part : parts) {
                                String trimmed = part.trim();

                                if (!trimmed.isEmpty()) {
                                        try {
                                                Long stockId = Long.parseLong(trimmed);
                                                stockIds.add(stockId);
                                        } catch (NumberFormatException e) {
                                                log.warn("숫자 변환 실패: '{}'", trimmed);
                                        }
                                }
                        }

                } catch (Exception e) {
                        log.error("stock_ids 파싱 실패: {}", stockIdsStr, e);
                }
                return stockIds;
        }

        // 주어진 리스트에서 랜덤하게 n개 선택
        private List<Long> selectRandomStocks(List<Long> stockIds, int count) {
                if (stockIds.size() <= count) {
                        return new ArrayList<>(stockIds);
                }

                List<Long> shuffled = new ArrayList<>(stockIds);
                Collections.shuffle(shuffled, new Random());
                return shuffled.subList(0, count);
        }

        // 기존에 선택된 주식들을 제외하고 새로운 n개 선택
        private List<Long> selectNewRandomStocks(Long regionId, List<Long> availableStockIds, int count) {
                try {
                        // 캐시 업데이트
                        updateCache();

                        // 캐시에서 기존 주식들 조회
                        Set<Long> existingStockIds = existingStockCache.getOrDefault(regionId, new HashSet<>());

                        // 기존 주식들을 제외한 새로운 주식들
                        List<Long> newStockIds = availableStockIds.stream()
                                        .filter(stockId -> !existingStockIds.contains(stockId))
                                        .collect(Collectors.toList());

                        // 새로운 주식이 충분하면 새로운 주식들에서 선택
                        if (newStockIds.size() >= count) {
                                return selectRandomStocks(newStockIds, count);
                        }

                        // 새로운 주식이 부족하면 가중치를 조정해서 선택
                        // 기존 주식들은 1/3 확률, 새로운 주식들은 2/3 확률로 선택
                        List<Long> allStockIds = new ArrayList<>(availableStockIds);
                        List<Long> selectedStocks = new ArrayList<>();
                        Random random = new Random();

                        while (selectedStocks.size() < count && !allStockIds.isEmpty()) {
                                int randomIndex = random.nextInt(allStockIds.size());
                                Long selectedStockId = allStockIds.get(randomIndex);

                                // 기존 주식인지 확인
                                boolean isExistingStock = existingStockIds.contains(selectedStockId);

                                // 기존 주식이면 1/3 확률로 선택, 새로운 주식이면 2/3 확률로 선택
                                if ((isExistingStock && random.nextDouble() < 0.33) ||
                                                (!isExistingStock && random.nextDouble() < 0.67)) {
                                        selectedStocks.add(selectedStockId);
                                        allStockIds.remove(randomIndex);
                                } else {
                                        // 선택되지 않으면 리스트에서 제거하고 다시 시도
                                        allStockIds.remove(randomIndex);
                                }
                        }

                        // 여전히 부족하면 전체에서 랜덤 선택
                        if (selectedStocks.size() < count) {
                                return selectRandomStocks(availableStockIds, count);
                        }

                        return selectedStocks;

                } catch (Exception e) {
                        log.error("새로운 주식 선택 실패 - regionId: {}", regionId, e);
                        return selectRandomStocks(availableStockIds, count);
                }
        }

        // 특정 지역의 특정 주식 popularityScore 증가
        private void updatePopularityScore(Long regionId, Long stockId) {
                try {
                        Region region = regionRepository.findById(regionId)
                                        .orElseThrow(() -> new IllegalArgumentException("지역을 찾을 수 없습니다: " + regionId));

                        Stock stock = stockRepository.findById(stockId)
                                        .orElseThrow(() -> new IllegalArgumentException("주식을 찾을 수 없습니다: " + stockId));

                        // 기존 RegionStock 찾기 또는 새로 생성
                        RegionStock regionStock = regionStockRepository.findByRegionAndStock(region, stock)
                                        .orElse(RegionStock.builder()
                                                        .region(region)
                                                        .stock(stock)
                                                        .dataDate(LocalDate.now())
                                                        .popularityScore(BigDecimal.ZERO)
                                                        .regionalRanking(0)
                                                        .trendScore(BigDecimal.ZERO)
                                                        .build());

                        // popularityScore 1 증가
                        regionStock.increasePopularityScore();

                        regionStockRepository.save(regionStock);

                } catch (Exception e) {
                        log.error("인기도 업데이트 실패 - regionId: {}, stockId: {}", regionId, stockId, e);
                }
        }

        // 배치 처리를 위한 업데이트 메서드
        private void updatePopularityScoresBatch(Map<Long, List<Long>> regionStockMap) {
                try {
                        // 모든 region_id와 stock_id 조합을 한 번에 조회
                        Set<Long> allRegionIds = regionStockMap.keySet();
                        Set<Long> allStockIds = regionStockMap.values().stream()
                                        .flatMap(List::stream)
                                        .collect(Collectors.toSet());

                        // 지역과 주식 정보를 한 번에 조회
                        Map<Long, Region> regions = regionRepository.findAllById(allRegionIds).stream()
                                        .collect(Collectors.toMap(Region::getId, region -> region));
                        Map<Long, Stock> stocks = stockRepository.findAllById(allStockIds).stream()
                                        .collect(Collectors.toMap(Stock::getId, stock -> stock));

                        // 기존 RegionStock 데이터를 한 번에 조회
                        List<RegionStock> existingStocks = regionStockRepository
                                        .findByRegion_IdIn(new ArrayList<>(allRegionIds));
                        Map<String, RegionStock> existingStockMap = existingStocks.stream()
                                        .collect(Collectors.toMap(
                                                        rs -> rs.getRegion().getId() + "_" + rs.getStock().getId(),
                                                        rs -> rs));

                        // 새로운 RegionStock 생성 및 기존 데이터 업데이트
                        List<RegionStock> toSave = new ArrayList<>();
                        LocalDate today = LocalDate.now();

                        for (Map.Entry<Long, List<Long>> entry : regionStockMap.entrySet()) {
                                Long regionId = entry.getKey();
                                List<Long> stockIds = entry.getValue();

                                Region region = regions.get(regionId);
                                if (region == null)
                                        continue;

                                for (Long stockId : stockIds) {
                                        Stock stock = stocks.get(stockId);
                                        if (stock == null)
                                                continue;

                                        String key = regionId + "_" + stockId;
                                        RegionStock regionStock = existingStockMap.get(key);

                                        if (regionStock == null) {
                                                // 새로운 RegionStock 생성
                                                regionStock = RegionStock.builder()
                                                                .region(region)
                                                                .stock(stock)
                                                                .dataDate(today)
                                                                .popularityScore(BigDecimal.ONE)
                                                                .regionalRanking(0)
                                                                .trendScore(BigDecimal.ZERO)
                                                                .build();
                                        } else {
                                                // 기존 데이터 업데이트
                                                regionStock.increasePopularityScore();
                                        }

                                        toSave.add(regionStock);
                                }
                        }

                        // 배치 저장
                        regionStockRepository.saveAll(toSave);

                } catch (Exception e) {
                        log.error("배치 인기도 업데이트 실패", e);
                }
        }
}