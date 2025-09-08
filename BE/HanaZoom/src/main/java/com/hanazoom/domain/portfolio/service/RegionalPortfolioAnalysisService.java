package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.portfolio.dto.RegionalPortfolioAnalysisDto;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import com.hanazoom.domain.region_stock.repository.RegionStockRepository;
import com.hanazoom.global.service.KakaoApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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

            RegionalPortfolioAnalysisDto.UserPortfolioInfo result = RegionalPortfolioAnalysisDto.UserPortfolioInfo.builder()
                    .stockCount((int) stats.getStockCount())
                    .totalValue(stats.getTotalValue())
                    .riskLevel(riskLevel)
                    .diversificationScore(diversificationScore)
                    .topStocks(List.of()) // 임시로 빈 리스트
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
            // 인기 주식 TOP 5 조회
            log.info("인기 주식 TOP 5 조회 시작");
            List<RegionStock> popularStocks = regionStockRepository
                    .findTopPopularStocksByRegionId(districtId, PageRequest.of(0, 5));
            log.info("인기 주식 조회 완료 - 조회된 주식 수: {}", popularStocks.size());

            // PopularStockInfo 리스트로 변환
            List<RegionalPortfolioAnalysisDto.PopularStockInfo> popularStockInfos = convertToPopularStockInfoList(popularStocks);
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

            RegionalPortfolioAnalysisDto.RegionalAverageInfo result = RegionalPortfolioAnalysisDto.RegionalAverageInfo.builder()
                    .averageStockCount(averageStockCount)
                    .averageTotalValue(averageTotalValue)
                    .commonRiskLevel(commonRiskLevel)
                    .averageDiversificationScore(averageDiversificationScore)
                    .popularStocks(popularStockInfos)
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

        int score = 100;

        // 종목 수 차이에 따른 감점
        score -= Math.abs(comparison.getStockCountDifference()) * 5;

        // 위험도 불일치 감점
        if (!comparison.isRiskLevelMatch()) {
            score -= 15;
        }

        // 분산도 차이에 따른 감점
        int diversificationDiff = Math.abs(userPortfolio.getDiversificationScore() - 
                regionalAverage.getAverageDiversificationScore());
        score -= diversificationDiff * 0.3;

        // 추천사항 개수에 따른 감점
        score -= comparison.getRecommendationCount() * 10;

        return Math.max(0, Math.min(100, score));
    }

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

        List<String> recommendations = new ArrayList<>();

        if (stockCountDifference < -2) {
            recommendations.add("지역 평균보다 종목 수가 적습니다. 분산 투자를 고려해보세요.");
        }

        if (!riskLevelMatch) {
            recommendations.add("지역 평균과 위험도가 다릅니다. 투자 성향을 재검토해보세요.");
        }

        if (userPortfolio.getDiversificationScore() < 60) {
            recommendations.add("포트폴리오 집중도가 높습니다. 리밸런싱을 권장합니다.");
        }

        return recommendations;
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
