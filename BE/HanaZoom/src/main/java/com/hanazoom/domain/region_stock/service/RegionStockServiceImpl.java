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


        private Map<Long, Set<Long>> existingStockCache = new HashMap<>();
        private LocalDate lastCacheUpdate = null;
        private Map<Long, List<Long>> csvDataCache = new HashMap<>();
        private LocalDate lastCsvCacheUpdate = null;


        private void updateCache() {
                LocalDate today = LocalDate.now();
                if (lastCacheUpdate == null || !lastCacheUpdate.equals(today)) {

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


                RegionStock regionStock = regionStockRepository.findByRegionIdAndStockIdAndDataDate(regionId, stock.getId(), targetDate);
                if (regionStock != null) {
                        log.info("✅ RegionStock 데이터 발견 - popularityScore: {}, regionalRanking: {}, trendScore: {}", 
                                regionStock.getPopularityScore(), regionStock.getRegionalRanking(), regionStock.getTrendScore());
                } else {
                        log.warn("⚠️ RegionStock 데이터 없음 - regionId: {}, stockId: {}, date: {}", regionId, stock.getId(), targetDate);
                        

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


                BigDecimal actualScore = regionStock != null ? regionStock.getPopularityScore() : BigDecimal.ZERO;
                BigDecimal actualTrend = regionStock != null ? regionStock.getTrendScore() : BigDecimal.ZERO;
                

                int actualRanking = regionStock != null ? regionStock.getRegionalRanking() : 1;
                if (actualRanking == 0) {
                    actualRanking = 1;
                }
                

                int postCount = postRepository.countByStockId(stock.getId());
                int commentCount = commentRepository.countByStockId(stock.getId());
                int voteCount = pollRepository.countByStockId(stock.getId());
                int viewCount = postRepository.sumViewCountByStockId(stock.getId());
                int searchCount = regionStock != null ? regionStock.getSearchCount() : 0;
                int newsMentionCount = regionStock != null ? regionStock.getNewsMentionCount() : 0;
                

                log.info("📊 [커뮤니티 데이터] regionId: {}, symbol: {}, postCount: {}, commentCount: {}, voteCount: {}, viewCount: {}, searchCount: {}", 
                        regionId, symbol, postCount, commentCount, voteCount, viewCount, searchCount);
                

                if (postCount > 0 || commentCount > 0 || voteCount > 0 || viewCount > 0) {
                    log.info("✅ [커뮤니티 데이터] 실제 데이터 발견 - postCount: {}, commentCount: {}, voteCount: {}, viewCount: {}", 
                            postCount, commentCount, voteCount, viewCount);
                } else {
                    log.warn("⚠️ [커뮤니티 데이터] 모든 값이 0 - regionId: {}, symbol: {}", regionId, symbol);
                }
                

                BigDecimal communityScore = calculateCommunityScore(postCount, commentCount, voteCount, viewCount, searchCount);
                

                BigDecimal momentumScore = calculateMomentumScore(actualTrend, searchCount, newsMentionCount);
                

                BigDecimal newsImpactScore = calculateNewsImpactScore(newsMentionCount);
                

                BigDecimal finalScore = calculateFinalScore(actualScore, communityScore, momentumScore, newsImpactScore);
                
                PopularityDetailsResponse response = PopularityDetailsResponse.builder()
                                .regionId(regionId)
                                .symbol(symbol)
                                .date(targetDate)
                                .score(finalScore) 
                                .tradeTrend(actualScore) 
                                .community(communityScore) 
                                .momentum(momentumScore) 
                                .newsImpact(newsImpactScore) 
                                .weightTradeTrend(new BigDecimal("0.45"))
                                .weightCommunity(new BigDecimal("0.35"))
                                .weightMomentum(new BigDecimal("0.20"))
                                .weightNews(new BigDecimal("0.00")) 
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

        private BigDecimal calculateCommunityScore(int postCount, int commentCount, int voteCount, int viewCount, int searchCount) {

                BigDecimal postWeight = new BigDecimal("0.25");
                BigDecimal commentWeight = new BigDecimal("0.20");
                BigDecimal voteWeight = new BigDecimal("0.20");
                BigDecimal viewWeight = new BigDecimal("0.20");
                BigDecimal searchWeight = new BigDecimal("0.15");
                

                BigDecimal postScore = calculateLogScore(postCount, 100); 
                BigDecimal commentScore = calculateLogScore(commentCount, 500); 
                BigDecimal voteScore = calculateLogScore(voteCount, 200); 
                BigDecimal viewScore = calculateLogScore(viewCount, 1000); 
                BigDecimal searchScore = calculateLogScore(searchCount, 300); 
                

                BigDecimal communityScore = postScore.multiply(postWeight)
                                .add(commentScore.multiply(commentWeight))
                                .add(voteScore.multiply(voteWeight))
                                .add(viewScore.multiply(viewWeight))
                                .add(searchScore.multiply(searchWeight));
                
                return communityScore.setScale(2, RoundingMode.HALF_UP);
        }

        private BigDecimal calculateMomentumScore(BigDecimal trendScore, int searchCount, int newsMentionCount) {

                BigDecimal trendComponent = trendScore;
                

                BigDecimal searchComponent = calculateLogScore(searchCount, 200).multiply(new BigDecimal("0.6"));
                

                BigDecimal newsComponent = calculateLogScore(newsMentionCount, 50).multiply(new BigDecimal("0.4"));
                

                BigDecimal momentumScore = trendComponent.multiply(new BigDecimal("0.5"))
                                .add(searchComponent)
                                .add(newsComponent);
                
                return momentumScore.setScale(2, RoundingMode.HALF_UP);
        }

        private BigDecimal calculateNewsImpactScore(int newsMentionCount) {
                return calculateLogScore(newsMentionCount, 100); 
        }

        private BigDecimal calculateFinalScore(BigDecimal tradeTrend, BigDecimal community, BigDecimal momentum, BigDecimal newsImpact) {
                BigDecimal weightTradeTrend = new BigDecimal("0.45");
                BigDecimal weightCommunity = new BigDecimal("0.35");
                BigDecimal weightMomentum = new BigDecimal("0.20");
                BigDecimal weightNews = new BigDecimal("0.00"); 
                
                BigDecimal finalScore = tradeTrend.multiply(weightTradeTrend)
                                .add(community.multiply(weightCommunity))
                                .add(momentum.multiply(weightMomentum))
                                .add(newsImpact.multiply(weightNews));
                
                return finalScore.setScale(2, RoundingMode.HALF_UP);
        }

        private BigDecimal calculateLogScore(int value, int maxValue) {
                if (value <= 0) {
                        return BigDecimal.ZERO;
                }
                if (value >= maxValue) {
                        return new BigDecimal("100");
                }
                

                double logValue = Math.log(1 + value);
                double logMax = Math.log(1 + maxValue);
                double ratio = logValue / logMax;
                
                return new BigDecimal(ratio * 100).setScale(2, RoundingMode.HALF_UP);
        }

        public RegionStatsResponse getRegionStats(Long regionId) {

                Region region = regionRepository.findById(regionId)
                                .orElseThrow(() -> new IllegalArgumentException("지역을 찾을 수 없습니다."));


                LocalDate today = LocalDate.now();
                RegionStockRepository.RegionStockStats stats = regionStockRepository.getRegionStatsForDate(regionId,
                                today);


                List<RegionStock> trendingStocks = regionStockRepository
                                .findTop5ByRegionIdAndDataDateOrderByPopularityScoreDesc(
                                                regionId,
                                                today,
                                                PageRequest.of(0, 5));




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
        @Scheduled(initialDelay = 3000, fixedRate = 600000) 
        public void updateRegionStocks() {
                log.info("지역별 주식 인기도 업데이트 시작...");

                try {

                        updateCsvCache();

                        Map<Long, List<Long>> regionStockMap = new HashMap<>();


                        for (Map.Entry<Long, List<Long>> entry : csvDataCache.entrySet()) {
                                Long regionId = entry.getKey();
                                List<Long> stockIds = entry.getValue();

                                if (!stockIds.isEmpty()) {

                                        List<Long> selectedStockIds = selectNewRandomStocks(regionId, stockIds, 3);


                                        regionStockMap.put(regionId, selectedStockIds);
                                }
                        }


                        if (!regionStockMap.isEmpty()) {
                                updatePopularityScoresBatch(regionStockMap);
                        }


                        aggregateRegionStocksUpwards(LocalDate.now());

                        log.info("지역별 주식 인기도 업데이트 완료");

                } catch (Exception e) {
                        log.error("지역별 주식 인기도 업데이트 실패", e);
                }
        }

        @Override
        public void getCurrentRegionStocks() {
                log.info("Getting current region stocks...");

        }

        private void aggregateRegionStocksUpwards(LocalDate targetDate) {
                log.info("=== 상위 지역 집계 시작: targetDate={}", targetDate);
                try {

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

        private void aggregateForParentFromChildren(Region parentRegion, List<Region> childRegions,
                        LocalDate targetDate) {

                List<Long> childIds = childRegions.stream().map(Region::getId).collect(Collectors.toList());


                List<RegionStock> childStocks = regionStockRepository.findByRegion_IdInAndDataDate(childIds,
                                targetDate);

                if (childStocks.isEmpty()) {
                        log.warn("부모 지역 '{}'의 자식 지역들에 주식 데이터가 없습니다.", parentRegion.getName());
                        return;
                }


                Map<Long, BigDecimal> stockIdToPopularity = new HashMap<>();
                Map<Long, Stock> stockIdToStock = new HashMap<>();

                for (RegionStock rs : childStocks) {
                        Long stockId = rs.getStock().getId();
                        stockIdToStock.putIfAbsent(stockId, rs.getStock());
                        BigDecimal current = stockIdToPopularity.getOrDefault(stockId, BigDecimal.ZERO);
                        BigDecimal add = rs.getPopularityScore() == null ? BigDecimal.ZERO : rs.getPopularityScore();
                        stockIdToPopularity.put(stockId, current.add(add));
                }


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

                log.debug("getTopStocksByRegion: regionId={}, limit={}", regionId, limit);


                Region region = regionRepository.findById(regionId)
                                .orElseThrow(() -> new IllegalArgumentException("지역을 찾을 수 없습니다."));
                log.debug("지역 정보: id={}, name={}, type={}", region.getId(), region.getName(), region.getType());


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


                List<StockTickerDto> result = topRegionStocks.stream()
                                .map(rs -> {
                                        String sector = rs.getStock().getSector() != null ? rs.getStock().getSector()
                                                        : "기타";


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


        private List<Long> parseStockIds(String stockIdsStr) {
                List<Long> stockIds = new ArrayList<>();
                try {

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


        private List<Long> selectRandomStocks(List<Long> stockIds, int count) {
                if (stockIds.size() <= count) {
                        return new ArrayList<>(stockIds);
                }

                List<Long> shuffled = new ArrayList<>(stockIds);
                Collections.shuffle(shuffled, new Random());
                return shuffled.subList(0, count);
        }


        private List<Long> selectNewRandomStocks(Long regionId, List<Long> availableStockIds, int count) {
                try {

                        updateCache();


                        Set<Long> existingStockIds = existingStockCache.getOrDefault(regionId, new HashSet<>());


                        List<Long> newStockIds = availableStockIds.stream()
                                        .filter(stockId -> !existingStockIds.contains(stockId))
                                        .collect(Collectors.toList());


                        if (newStockIds.size() >= count) {
                                return selectRandomStocks(newStockIds, count);
                        }



                        List<Long> allStockIds = new ArrayList<>(availableStockIds);
                        List<Long> selectedStocks = new ArrayList<>();
                        Random random = new Random();

                        while (selectedStocks.size() < count && !allStockIds.isEmpty()) {
                                int randomIndex = random.nextInt(allStockIds.size());
                                Long selectedStockId = allStockIds.get(randomIndex);


                                boolean isExistingStock = existingStockIds.contains(selectedStockId);


                                if ((isExistingStock && random.nextDouble() < 0.33) ||
                                                (!isExistingStock && random.nextDouble() < 0.67)) {
                                        selectedStocks.add(selectedStockId);
                                        allStockIds.remove(randomIndex);
                                } else {

                                        allStockIds.remove(randomIndex);
                                }
                        }


                        if (selectedStocks.size() < count) {
                                return selectRandomStocks(availableStockIds, count);
                        }

                        return selectedStocks;

                } catch (Exception e) {
                        log.error("새로운 주식 선택 실패 - regionId: {}", regionId, e);
                        return selectRandomStocks(availableStockIds, count);
                }
        }


        private void updatePopularityScore(Long regionId, Long stockId) {
                try {
                        Region region = regionRepository.findById(regionId)
                                        .orElseThrow(() -> new IllegalArgumentException("지역을 찾을 수 없습니다: " + regionId));

                        Stock stock = stockRepository.findById(stockId)
                                        .orElseThrow(() -> new IllegalArgumentException("주식을 찾을 수 없습니다: " + stockId));


                        RegionStock regionStock = regionStockRepository.findByRegionAndStock(region, stock)
                                        .orElse(RegionStock.builder()
                                                        .region(region)
                                                        .stock(stock)
                                                        .dataDate(LocalDate.now())
                                                        .popularityScore(BigDecimal.ZERO)
                                                        .regionalRanking(0)
                                                        .trendScore(BigDecimal.ZERO)
                                                        .build());


                        regionStock.increasePopularityScore();

                        regionStockRepository.save(regionStock);

                } catch (Exception e) {
                        log.error("인기도 업데이트 실패 - regionId: {}, stockId: {}", regionId, stockId, e);
                }
        }


        private void updatePopularityScoresBatch(Map<Long, List<Long>> regionStockMap) {
                try {

                        Set<Long> allRegionIds = regionStockMap.keySet();
                        Set<Long> allStockIds = regionStockMap.values().stream()
                                        .flatMap(List::stream)
                                        .collect(Collectors.toSet());


                        Map<Long, Region> regions = regionRepository.findAllById(allRegionIds).stream()
                                        .collect(Collectors.toMap(Region::getId, region -> region));
                        Map<Long, Stock> stocks = stockRepository.findAllById(allStockIds).stream()
                                        .collect(Collectors.toMap(Stock::getId, stock -> stock));


                        List<RegionStock> existingStocks = regionStockRepository
                                        .findByRegion_IdIn(new ArrayList<>(allRegionIds));
                        Map<String, RegionStock> existingStockMap = existingStocks.stream()
                                        .collect(Collectors.toMap(
                                                        rs -> rs.getRegion().getId() + "_" + rs.getStock().getId(),
                                                        rs -> rs));


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

                                                regionStock = RegionStock.builder()
                                                                .region(region)
                                                                .stock(stock)
                                                                .dataDate(today)
                                                                .popularityScore(BigDecimal.ONE)
                                                                .regionalRanking(0)
                                                                .trendScore(BigDecimal.ZERO)
                                                                .build();
                                        } else {

                                                regionStock.increasePopularityScore();
                                        }

                                        toSave.add(regionStock);
                                }
                        }


                        regionStockRepository.saveAll(toSave);

                } catch (Exception e) {
                        log.error("배치 인기도 업데이트 실패", e);
                }
        }
}