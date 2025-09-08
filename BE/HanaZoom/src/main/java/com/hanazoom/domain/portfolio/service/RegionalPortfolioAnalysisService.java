package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.portfolio.dto.RegionalPortfolioAnalysisDto;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.region_stock.repository.RegionStockRepository;
import com.hanazoom.global.service.KakaoApiService;
import com.hanazoom.domain.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionalPortfolioAnalysisService {

    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;
    private final RegionStockRepository regionStockRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final KakaoApiService kakaoApiService;
    private final StockRepository stockRepository;

    /**
     * 사용자의 지역별 포트폴리오 분석 결과를 조회합니다.
     * 
     * @param memberId 현재 로그인한 사용자의 ID
     * @return 지역별 포트폴리오 분석 결과
     */
    public RegionalPortfolioAnalysisDto analyzeRegionalPortfolio(UUID memberId) {
        log.info("=== 지역별 포트폴리오 분석 시작 ===");
        log.info("요청된 memberId: {}", memberId);

        try {
            // 1. 사용자 정보 조회
            log.info("1단계: 사용자 정보 조회 시작");
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> {
                        log.error("❌ 사용자를 찾을 수 없습니다: {}", memberId);
                        return new IllegalArgumentException("사용자를 찾을 수 없습니다: " + memberId);
                    });
            log.info("✅ 사용자 정보 조회 완료 - ID: {}, 이름: {}, regionId: {}", 
                    member.getId(), member.getName(), member.getRegionId());

        // 2. 사용자의 지역구 ID 조회 (regionId 기반)
        log.info("2단계: 지역구 ID 조회 시작");
        Long districtId = getDistrictIdFromMember(member);
        if (districtId == null) {
            log.error("❌ 지역구 ID를 찾을 수 없습니다. regionId: {}", member.getRegionId());
            throw new IllegalArgumentException("지역 정보를 찾을 수 없습니다. regionId: " + member.getRegionId());
        }
        log.info("✅ 지역구 ID 조회 완료 - districtId: {}", districtId);

        // 2-1. 지역명 조회
        log.info("2-1단계: 지역명 조회 시작");
        String regionName = regionRepository.findRegionNameById(districtId)
                .orElse("알 수 없는 지역");
        log.info("✅ 지역명 조회 완료 - regionName: {}", regionName);

            // 3. 사용자 포트폴리오 분석
            log.info("3단계: 사용자 포트폴리오 분석 시작");
            RegionalPortfolioAnalysisDto.UserPortfolioInfo userPortfolio = analyzeUserPortfolio(member);
            log.info("✅ 사용자 포트폴리오 분석 완료 - 종목수: {}, 총가치: {}", 
                    userPortfolio.getStockCount(), userPortfolio.getTotalValue());

            // 4. 지역 평균 데이터 분석
            log.info("4단계: 지역 평균 데이터 분석 시작");
            RegionalPortfolioAnalysisDto.RegionalAverageInfo regionalAverage = analyzeRegionalAverage(districtId);
            log.info("✅ 지역 평균 데이터 분석 완료 - 평균종목수: {}, 평균총가치: {}", 
                    regionalAverage.getAverageStockCount(), regionalAverage.getAverageTotalValue());

            // 5. 비교 분석 및 점수 계산
            log.info("5단계: 비교 분석 및 점수 계산 시작");
            RegionalPortfolioAnalysisDto.ComparisonResult comparison = comparePortfolios(userPortfolio, regionalAverage);
            int suitabilityScore = calculateSuitabilityScore(userPortfolio, regionalAverage, comparison);
            log.info("✅ 비교 분석 완료 - 적합도 점수: {}점", suitabilityScore);

            log.info("=== 지역별 포트폴리오 분석 완료 ===");
            log.info("최종 결과 - 사용자: {}, 지역구: {}, 적합도: {}점", 
                    member.getName(), districtId, suitabilityScore);

            return RegionalPortfolioAnalysisDto.builder()
                    .regionName(regionName)
                    .userPortfolio(userPortfolio)
                    .regionalAverage(regionalAverage)
                    .comparison(comparison)
                    .suitabilityScore(suitabilityScore)
                    .build();

        } catch (IllegalArgumentException e) {
            log.error("❌ 지역별 포트폴리오 분석 실패 - 잘못된 요청: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ 지역별 포트폴리오 분석 중 예상치 못한 오류 발생", e);
            throw new RuntimeException("지역별 포트폴리오 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 사용자의 지역구 ID를 조회합니다. (regionId 기반으로 단순화)
     */
    private Long getDistrictIdFromMember(Member member) {
        log.info("사용자 지역 정보 조회 시작 - memberId: {}, regionId: {}", member.getId(), member.getRegionId());
        
        // regionId가 null인 경우 예외 발생
        if (member.getRegionId() == null) {
            log.error("❌ 사용자의 regionId가 null입니다. memberId: {}", member.getId());
            throw new IllegalArgumentException("사용자의 지역 정보가 설정되지 않았습니다.");
        }

        try {
            // 1. 먼저 regionId가 DISTRICT인지 확인
            log.info("regionId로 지역구 조회 시도 - regionId: {}", member.getRegionId());
            Optional<Region> district = regionRepository.findDistrictByRegionId(member.getRegionId());
            
            if (district.isPresent()) {
                log.info("✅ regionId가 DISTRICT입니다 - districtId: {}, districtName: {}", 
                        district.get().getId(), district.get().getName());
                return district.get().getId();
            }
            
            // 2. regionId가 NEIGHBORHOOD인 경우 부모 지역구 조회
            log.info("regionId가 DISTRICT가 아닙니다. NEIGHBORHOOD인지 확인 - regionId: {}", member.getRegionId());
            Optional<Region> parentDistrict = regionRepository.findDistrictByNeighborhoodId(member.getRegionId());
            
            if (parentDistrict.isPresent()) {
                log.info("✅ regionId가 NEIGHBORHOOD입니다 - parentDistrictId: {}, parentDistrictName: {}", 
                        parentDistrict.get().getId(), parentDistrict.get().getName());
                return parentDistrict.get().getId();
            }
            
            // 3. 둘 다 실패한 경우
            log.error("❌ regionId로 지역구를 찾을 수 없습니다. regionId: {}", member.getRegionId());
            throw new IllegalArgumentException("지역구 정보를 찾을 수 없습니다. regionId: " + member.getRegionId());

        } catch (IllegalArgumentException e) {
            log.error("❌ 지역구 조회 실패 - {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ 지역구 조회 중 예상치 못한 오류 발생", e);
            throw new RuntimeException("지역구 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 사용자 포트폴리오를 분석합니다.
     */
    private RegionalPortfolioAnalysisDto.UserPortfolioInfo analyzeUserPortfolio(Member member) {
        log.info("사용자 포트폴리오 분석 시작 - memberId: {}", member.getId());
        
        try {
            // 사용자의 메인 계좌 조회
            Account mainAccount = member.getMainAccount();
            if (mainAccount == null) {
                log.warn("⚠️ 사용자의 메인 계좌가 없습니다. 빈 포트폴리오 반환");
                return createEmptyUserPortfolio();
            }
            log.info("메인 계좌 조회 완료 - accountId: {}", mainAccount.getId());

            // 포트폴리오 통계 조회
            log.info("포트폴리오 통계 조회 시작");
            PortfolioStockRepository.UserPortfolioStats stats = portfolioStockRepository
                    .getUserPortfolioStats(mainAccount.getId());
            log.info("포트폴리오 통계 조회 완료 - 종목수: {}, 총가치: {}, 평균수익률: {}", 
                    stats.getStockCount(), stats.getTotalValue(), stats.getAvgProfitLossRate());

            // 위험도 계산
            String riskLevel = calculateRiskLevel(stats.getAvgProfitLossRate());
            log.info("위험도 계산 완료 - riskLevel: {}", riskLevel);

            // 분산도 계산
            int diversificationScore = calculateDiversificationScore(stats.getStockCount());
            log.info("분산도 계산 완료 - diversificationScore: {}", diversificationScore);

            // 상위 보유 종목 TOP5 (평가금액 기준)
            List<PortfolioStock> topHoldings = portfolioStockRepository
                    .findTopHoldingStocksByAccountId(mainAccount.getId());

            java.util.List<RegionalPortfolioAnalysisDto.StockInfo> topStocks = topHoldings.stream()
                    .limit(5)
                    .map(ps -> {
                        var stockOpt = stockRepository.findBySymbol(ps.getStockSymbol());
                        String name = stockOpt.map(s -> s.getName()).orElse(ps.getStockSymbol());
                        String logoUrl = stockOpt.map(s -> s.getLogoUrl()).orElse(null);
                        return RegionalPortfolioAnalysisDto.StockInfo.builder()
                                .symbol(ps.getStockSymbol())
                                .name(name)
                                .logoUrl(logoUrl)
                                .percentage(calculateHoldingPercentage(ps.getCurrentValue(), stats.getTotalValue()))
                                .build();
                    })
                    .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

            RegionalPortfolioAnalysisDto.UserPortfolioInfo result = RegionalPortfolioAnalysisDto.UserPortfolioInfo.builder()
                    .stockCount((int) stats.getStockCount())
                    .totalValue(stats.getTotalValue())
                    .riskLevel(riskLevel)
                    .diversificationScore(diversificationScore)
                    .topStocks(topStocks)
                    .build();

            log.info("✅ 사용자 포트폴리오 분석 완료");
            return result;

        } catch (Exception e) {
            log.error("❌ 사용자 포트폴리오 분석 중 오류 발생", e);
            throw new RuntimeException("사용자 포트폴리오 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 지역 평균 데이터를 분석합니다.
     */
    private RegionalPortfolioAnalysisDto.RegionalAverageInfo analyzeRegionalAverage(Long districtId) {
        log.info("지역 평균 데이터 분석 시작 - districtId: {}", districtId);
        
        try {
            // 인기 주식 TOP 5 조회 (전체 기간 누적 인기도 기준)
            log.info("인기 주식 TOP 5 조회 시작 (전체 기간 누적)");
            List<RegionStockRepository.RegionStockPopularityAgg> aggTop = regionStockRepository
                    .findTopPopularStocksAggregatedByRegion(districtId, PageRequest.of(0, 5));
            List<RegionalPortfolioAnalysisDto.PopularStockInfo> popularStockInfos = new java.util.ArrayList<>();
            for (int i = 0; i < aggTop.size(); i++) {
                var a = aggTop.get(i);
                popularStockInfos.add(RegionalPortfolioAnalysisDto.PopularStockInfo.builder()
                        .symbol(a.getStock().getSymbol())
                        .name(a.getStock().getName())
                        .popularityScore(null)
                        .ranking(i + 1)
                        .logoUrl(a.getStock().getLogoUrl())
                        .build());
            }
            log.info("인기 주식 정보 변환 완료 - 변환된 주식 수: {}", popularStockInfos.size());

            // 실제 지역 평균 통계 조회
            log.info("지역 평균 통계 조회 시작");
            RegionStockRepository.RegionalPortfolioStats regionalStats = regionStockRepository
                    .getRegionalPortfolioStats(districtId);
            log.info("지역 평균 통계 조회 완료 - 종목수: {}, 평균인기도: {}, 평균트렌드: {}", 
                    regionalStats.getStockCount(), regionalStats.getAvgPopularityScore(), regionalStats.getAvgTrendScore());

            // 실제 데이터로 계산
            int averageStockCount = (int) regionalStats.getStockCount();
            BigDecimal averageTotalValue = new BigDecimal("15000000"); // TODO: 실제 평균 자산 계산 필요
            String commonRiskLevel = "보통"; // TODO: 실제 위험도 계산 필요
            int averageDiversificationScore = 72; // TODO: 실제 분산도 계산 필요

            // 간단한 섹터 분포 트렌드: 최신 날짜의 해당 지역 모든 RegionStock을 기반으로 계산
            List<RegionStock> latestRegionStocks = regionStockRepository.findByRegion_Id(districtId);
            java.util.Map<String, Long> sectorCounts = latestRegionStocks.stream()
                    .map(rs -> rs.getStock())
                    .filter(st -> st != null)
                    .map(st -> st.getSector() == null ? "기타" : st.getSector())
                    .collect(java.util.stream.Collectors.groupingBy(s -> s, java.util.stream.Collectors.counting()));

            long totalCount = sectorCounts.values().stream().mapToLong(Long::longValue).sum();
            List<RegionalPortfolioAnalysisDto.InvestmentTrend> investmentTrends = sectorCounts.entrySet().stream()
                    .map(e -> RegionalPortfolioAnalysisDto.InvestmentTrend.builder()
                            .sector(e.getKey())
                            .percentage(totalCount == 0 ? BigDecimal.ZERO : new BigDecimal(e.getValue() * 100.0 / totalCount))
                            .build())
                    .collect(java.util.stream.Collectors.toList());

            RegionalPortfolioAnalysisDto.RegionalAverageInfo result = RegionalPortfolioAnalysisDto.RegionalAverageInfo.builder()
                    .averageStockCount(averageStockCount)
                    .averageTotalValue(averageTotalValue)
                    .commonRiskLevel(commonRiskLevel)
                    .averageDiversificationScore(averageDiversificationScore)
                    .popularStocks(popularStockInfos)
                    .investmentTrends(investmentTrends)
                    .build();

            log.info("✅ 지역 평균 데이터 분석 완료");
            return result;

        } catch (Exception e) {
            log.error("❌ 지역 평균 데이터 분석 중 오류 발생", e);
            throw new RuntimeException("지역 평균 데이터 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 포트폴리오를 비교 분석합니다.
     */
    private RegionalPortfolioAnalysisDto.ComparisonResult comparePortfolios(
            RegionalPortfolioAnalysisDto.UserPortfolioInfo userPortfolio,
            RegionalPortfolioAnalysisDto.RegionalAverageInfo regionalAverage) {

        int stockCountDifference = userPortfolio.getStockCount() - regionalAverage.getAverageStockCount();
        boolean riskLevelMatch = userPortfolio.getRiskLevel().equals(regionalAverage.getCommonRiskLevel());

        // 추천사항 생성
        List<String> recommendations = generateRecommendations(
                userPortfolio, regionalAverage, stockCountDifference, riskLevelMatch);

        return RegionalPortfolioAnalysisDto.ComparisonResult.builder()
                .stockCountDifference(stockCountDifference)
                .riskLevelMatch(riskLevelMatch)
                .recommendationCount(recommendations.size())
                .recommendations(recommendations)
                .build();
    }

    /**
     * 지역 적합도 점수를 계산합니다.
     */
    private int calculateSuitabilityScore(
            RegionalPortfolioAnalysisDto.UserPortfolioInfo userPortfolio,
            RegionalPortfolioAnalysisDto.RegionalAverageInfo regionalAverage,
            RegionalPortfolioAnalysisDto.ComparisonResult comparison) {
        // ------------------ 섹터 중심 적합도 산출 ------------------
        // 1) 섹터 분포 (사용자 / 지역)
        java.util.Map<String, java.math.BigDecimal> userSectorDist = buildUserSectorDistribution(userPortfolio);
        java.util.Map<String, java.math.BigDecimal> regionSectorDist = buildRegionSectorDistribution(regionalAverage);

        double sSector = computeSectorAlignmentScore(userSectorDist, regionSectorDist); // 0~100

        // 2) 섹터 내 비중 정렬도: 사용자 종목 비중 vs 해당 섹터 타겟 가중
        double sIntra = computeIntraSectorWeightScore(userPortfolio, regionSectorDist); // 0~100

        // 3) 섹터 커버리지(가중 Jaccard)
        double sCoverage = computeSectorCoverageScore(userSectorDist, regionSectorDist); // 0~100

        // 4) 집중도 페널티 (Top5 비중)
        double pConc = computeConcentrationPenalty(userPortfolio); // 0~100, 나중에 가중 감점

        // 5) 섹터 HHI 초과 페널티
        double pHHI = computeSectorHHIPenalty(userSectorDist, regionSectorDist); // 0~100

        // 가중 합성
        double w1 = 0.45, w2 = 0.25, w3 = 0.20, gamma = 0.05, delta = 0.05;
        double score = w1 * sSector + w2 * sIntra + w3 * sCoverage
                - gamma * pConc - delta * pHHI;

        // 위험도 일치 보너스/페널티(소폭): 일치 +3, 불일치 -3
        score += comparison.isRiskLevelMatch() ? 3 : -3;

        // 0~100 클램프
        score = Math.max(0, Math.min(100, score));
        return (int) Math.round(score);
    }

    // ------------------ Sector-based scoring helpers ------------------

    private java.util.Map<String, java.math.BigDecimal> buildUserSectorDistribution(
            RegionalPortfolioAnalysisDto.UserPortfolioInfo userPortfolio) {
        java.util.Map<String, java.math.BigDecimal> sectorToWeight = new java.util.HashMap<>();
        if (userPortfolio.getTopStocks() == null) return sectorToWeight;
        for (RegionalPortfolioAnalysisDto.StockInfo s : userPortfolio.getTopStocks()) {
            if (s.getSymbol() == null) continue;
            var stockOpt = stockRepository.findBySymbol(s.getSymbol());
            String sector = stockOpt.map(st -> st.getSector()).orElse("기타");
            java.math.BigDecimal pct = s.getPercentage() == null ? java.math.BigDecimal.ZERO : s.getPercentage();
            sectorToWeight.merge(sector, pct, java.math.BigDecimal::add);
        }
        // 정규화 (합계 100 -> 1로 변환)
        java.math.BigDecimal total = sectorToWeight.values().stream().reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        if (total.compareTo(java.math.BigDecimal.ZERO) > 0) {
            sectorToWeight.replaceAll((k, v) -> v.divide(total, 6, java.math.RoundingMode.HALF_UP));
        }
        return sectorToWeight;
    }

    private java.util.Map<String, java.math.BigDecimal> buildRegionSectorDistribution(
            RegionalPortfolioAnalysisDto.RegionalAverageInfo regionalAverage) {
        java.util.Map<String, java.math.BigDecimal> sectorToWeight = new java.util.HashMap<>();
        if (regionalAverage.getInvestmentTrends() == null) return sectorToWeight;
        for (RegionalPortfolioAnalysisDto.InvestmentTrend t : regionalAverage.getInvestmentTrends()) {
            if (t.getSector() == null) continue;
            java.math.BigDecimal pct = t.getPercentage() == null ? java.math.BigDecimal.ZERO : t.getPercentage();
            sectorToWeight.merge(t.getSector(), pct, java.math.BigDecimal::add);
        }
        // 입력이 0~100 비율일 수 있으니 정규화
        java.math.BigDecimal total = sectorToWeight.values().stream().reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        if (total.compareTo(java.math.BigDecimal.ZERO) > 0) {
            sectorToWeight.replaceAll((k, v) -> v.divide(total, 6, java.math.RoundingMode.HALF_UP));
        }
        return sectorToWeight;
    }

    private double computeSectorAlignmentScore(java.util.Map<String, java.math.BigDecimal> p,
                                               java.util.Map<String, java.math.BigDecimal> q) {
        // JS Divergence 기반 0~100
        double d = jsDivergence(p, q); // 0~ln2
        double max = Math.log(2);
        double score = (max <= 0) ? 0 : (1.0 - d / max) * 100.0;
        return clamp(score);
    }

    private double computeIntraSectorWeightScore(RegionalPortfolioAnalysisDto.UserPortfolioInfo user,
                                                 java.util.Map<String, java.math.BigDecimal> regionSector) {
        if (user.getTopStocks() == null || user.getTopStocks().isEmpty()) return 0.0;
        // 벡터: w_i = 내 종목 비중(합=1로 정규화), r_i = 해당 종목의 섹터 타겟 가중
        java.util.List<Double> w = new java.util.ArrayList<>();
        java.util.List<Double> r = new java.util.ArrayList<>();

        java.math.BigDecimal totalPct = user.getTopStocks().stream()
                .map(s -> s.getPercentage() == null ? java.math.BigDecimal.ZERO : s.getPercentage())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        for (RegionalPortfolioAnalysisDto.StockInfo s : user.getTopStocks()) {
            var st = stockRepository.findBySymbol(s.getSymbol());
            String sector = st.map(x -> x.getSector()).orElse("기타");
            double wi = totalPct.compareTo(java.math.BigDecimal.ZERO) == 0 ? 0.0
                    : (s.getPercentage() == null ? 0.0 : s.getPercentage().divide(totalPct, 6, java.math.RoundingMode.HALF_UP).doubleValue());
            double ri = regionSector.getOrDefault(sector, java.math.BigDecimal.ZERO).doubleValue();
            w.add(wi);
            r.add(ri);
        }
        double sim = cosineSimilarity(w, r); // 0~1
        return clamp(sim * 100.0);
    }

    private double computeSectorCoverageScore(java.util.Map<String, java.math.BigDecimal> p,
                                              java.util.Map<String, java.math.BigDecimal> q) {
        // 가중 Jaccard: Σ min / Σ max
        java.util.HashSet<String> keys = new java.util.HashSet<>();
        keys.addAll(p.keySet());
        keys.addAll(q.keySet());
        double sumMin = 0.0, sumMax = 0.0;
        for (String k : keys) {
            double a = p.getOrDefault(k, java.math.BigDecimal.ZERO).doubleValue();
            double b = q.getOrDefault(k, java.math.BigDecimal.ZERO).doubleValue();
            sumMin += Math.min(a, b);
            sumMax += Math.max(a, b);
        }
        double jac = (sumMax == 0.0) ? 0.0 : (sumMin / sumMax);
        return clamp(jac * 100.0);
    }

    private double computeConcentrationPenalty(RegionalPortfolioAnalysisDto.UserPortfolioInfo user) {
        if (user.getTopStocks() == null || user.getTopStocks().isEmpty()) return 0.0;
        java.util.List<java.math.BigDecimal> pcts = user.getTopStocks().stream()
                .map(s -> s.getPercentage() == null ? java.math.BigDecimal.ZERO : s.getPercentage())
                .sorted(java.util.Comparator.reverseOrder())
                .toList();
        java.math.BigDecimal total = pcts.stream().reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal top5 = java.math.BigDecimal.ZERO;
        for (int i = 0; i < Math.min(5, pcts.size()); i++) top5 = top5.add(pcts.get(i));
        double c5 = total.compareTo(java.math.BigDecimal.ZERO) == 0 ? 0.0
                : top5.divide(total, 6, java.math.RoundingMode.HALF_UP).doubleValue();
        double theta = 0.6; // 60%
        double penalty = Math.max(0.0, (c5 - theta) / (1.0 - theta)) * 100.0; // 0~100
        return clamp(penalty);
    }

    private double computeSectorHHIPenalty(java.util.Map<String, java.math.BigDecimal> user,
                                           java.util.Map<String, java.math.BigDecimal> region) {
        double hhiU = user.values().stream().mapToDouble(v -> Math.pow(v.doubleValue(), 2)).sum();
        double hhiR = region.values().stream().mapToDouble(v -> Math.pow(v.doubleValue(), 2)).sum();
        double delta = Math.max(0.0, hhiU - hhiR);
        double deltaMax = 0.5; // 경험적 상한
        double penalty = Math.min(1.0, delta / deltaMax) * 100.0;
        return clamp(penalty);
    }

    private double jsDivergence(java.util.Map<String, java.math.BigDecimal> p,
                                java.util.Map<String, java.math.BigDecimal> q) {
        java.util.HashSet<String> keys = new java.util.HashSet<>();
        keys.addAll(p.keySet());
        keys.addAll(q.keySet());
        double kl1 = 0.0, kl2 = 0.0;
        for (String k : keys) {
            double a = p.getOrDefault(k, java.math.BigDecimal.ZERO).doubleValue();
            double b = q.getOrDefault(k, java.math.BigDecimal.ZERO).doubleValue();
            double m = 0.5 * (a + b);
            kl1 += kl(a, m);
            kl2 += kl(b, m);
        }
        return 0.5 * (kl1 + kl2); // 0~ln2
    }

    private double kl(double a, double b) {
        if (a <= 0.0) return 0.0;
        if (b <= 0.0) b = 1e-12;
        return a * Math.log(a / b);
    }

    private double cosineSimilarity(java.util.List<Double> a, java.util.List<Double> b) {
        if (a.isEmpty() || b.isEmpty() || a.size() != b.size()) return 0.0;
        double dot = 0.0, na = 0.0, nb = 0.0;
        for (int i = 0; i < a.size(); i++) {
            double x = a.get(i), y = b.get(i);
            dot += x * y;
            na += x * x;
            nb += y * y;
        }
        if (na == 0 || nb == 0) return 0.0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    private double clamp(double v) { return Math.max(0.0, Math.min(100.0, v)); }

    /**
     * 위험도를 계산합니다.
     */
    private String calculateRiskLevel(BigDecimal avgProfitLossRate) {
        if (avgProfitLossRate == null) return "보통";
        
        double rate = avgProfitLossRate.doubleValue();
        if (rate < -10) return "높음";
        if (rate < 5) return "보통";
        return "낮음";
    }

    /**
     * 분산도를 계산합니다.
     */
    private int calculateDiversificationScore(long stockCount) {
        if (stockCount <= 1) return 20;
        if (stockCount <= 3) return 40;
        if (stockCount <= 5) return 60;
        if (stockCount <= 8) return 80;
        return 90;
    }

    private BigDecimal calculateHoldingPercentage(BigDecimal part, BigDecimal total) {
        if (part == null || total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return part.multiply(new BigDecimal("100")).divide(total, 2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * 빈 사용자 포트폴리오를 생성합니다.
     */
    private RegionalPortfolioAnalysisDto.UserPortfolioInfo createEmptyUserPortfolio() {
        return RegionalPortfolioAnalysisDto.UserPortfolioInfo.builder()
                .stockCount(0)
                .totalValue(BigDecimal.ZERO)
                .riskLevel("보통")
                .diversificationScore(0)
                .topStocks(List.of())
                .build();
    }

    /**
     * 추천사항을 생성합니다.
     */
    private List<String> generateRecommendations(
            RegionalPortfolioAnalysisDto.UserPortfolioInfo userPortfolio,
            RegionalPortfolioAnalysisDto.RegionalAverageInfo regionalAverage,
            int stockCountDifference,
            boolean riskLevelMatch) {

        List<String> out = new ArrayList<>();

        // 지표 계산 재사용 (섹터 기반)
        Map<String, BigDecimal> userSector = buildUserSectorDistribution(userPortfolio);
        Map<String, BigDecimal> regionSector = buildRegionSectorDistribution(regionalAverage);

        double sSector = computeSectorAlignmentScore(userSector, regionSector);     // 0~100
        double sIntra  = computeIntraSectorWeightScore(userPortfolio, regionSector);// 0~100
        double sCover  = computeSectorCoverageScore(userSector, regionSector);      // 0~100
        double pConc   = computeConcentrationPenalty(userPortfolio);                // 0~100
        double pHHI    = computeSectorHHIPenalty(userSector, regionSector);         // 0~100

        // 1) 섹터 정렬 이슈
        if (sSector < 60 && out.size() < 3) {
            // 상위 지역 섹터 후보 추출
            String topRegionSector = regionSector.entrySet().stream()
                    .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                    .map(Map.Entry::getKey)
                    .findFirst().orElse("핵심 섹터");
            out.add(String.format("지역 핵심 섹터(%s) 비중이 낮습니다. 해당 섹터 비중 확대를 검토하세요.", topRegionSector));
        }

        // 2) 섹터 커버리지 부족
        if (sCover < 65 && out.size() < 3) {
            // 미커버 섹터 하나 추천
            String gapSector = regionSector.keySet().stream()
                    .filter(s -> userSector.getOrDefault(s, BigDecimal.ZERO).compareTo(BigDecimal.ZERO) == 0)
                    .findFirst().orElse("미커버 섹터");
            out.add(String.format("지역 코어 섹터 노출이 부족합니다. %s 편입을 소액부터 시도해보세요.", gapSector));
        }

        // 3) 섹터 내 비중 정렬 이슈
        if (sIntra < 60 && out.size() < 3) {
            out.add("섹터 내부 종목 비중이 지역 선호와 다릅니다. 동일 섹터 내 종목·비중 재배치를 권장합니다.");
        }

        // 4) 집중도/HHI 페널티
        if ((pConc > 20 || pHHI > 20) && out.size() < 3) {
            out.add("상위/섹터 집중도가 높습니다. 상위 종목 비중을 줄여 분산도를 높이세요.");
        }

        // 5) 위험도 정렬
        if (!riskLevelMatch && out.size() < 3) {
            out.add("지역 평균과 위험도 수준이 다릅니다. 변동성 관리(현금·채권·저변동 ETF 등)를 고려하세요.");
        }

        // 보강: 종목 수 차이만으로는 강한 메시지를 내지 않음(보조)
        if (out.isEmpty()) {
            if (stockCountDifference < -2) {
                out.add("지역 평균 대비 보유 종목 수가 적습니다. 저평가 섹터/종목으로 분산을 확대하세요.");
            } else if (stockCountDifference > 3) {
                out.add("종목 수가 많아 관리가 어려울 수 있습니다. 비핵심 종목을 간소화해 집중도를 조정하세요.");
            }
        }

        return out;
    }


    /**
     * PopularStockInfo 리스트로 변환합니다.
     */
    private List<RegionalPortfolioAnalysisDto.PopularStockInfo> convertToPopularStockInfoList(
            List<RegionStock> popularStocks) {
        log.info("PopularStockInfo 변환 시작 - 입력 주식 수: {}", popularStocks.size());
        
        try {
            List<RegionalPortfolioAnalysisDto.PopularStockInfo> result = popularStocks.stream()
                    .map(rs -> {
                        try {
                            return RegionalPortfolioAnalysisDto.PopularStockInfo.builder()
                                    .symbol(rs.getStock().getSymbol())
                                    .name(rs.getStock().getName())
                                    .popularityScore(rs.getPopularityScore())
                                    .ranking(rs.getRegionalRanking())
                                    .build();
                        } catch (Exception e) {
                            log.error("❌ 주식 정보 변환 중 오류 발생 - stock: {}", rs.getStock(), e);
                            throw new RuntimeException("주식 정보 변환 중 오류가 발생했습니다: " + e.getMessage(), e);
                        }
                    })
                    .collect(Collectors.toList());

            log.info("✅ PopularStockInfo 변환 완료 - 변환된 주식 수: {}", result.size());
            return result;

        } catch (Exception e) {
            log.error("❌ PopularStockInfo 변환 중 오류 발생", e);
            throw new RuntimeException("PopularStockInfo 변환 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
