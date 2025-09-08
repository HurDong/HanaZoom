package com.hanazoom.domain.region_stock.repository;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.region_stock.entity.RegionStock;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegionStockRepository extends JpaRepository<RegionStock, Long> {

        @Modifying
        @Query("DELETE FROM RegionStock rs WHERE rs.dataDate = :date")
        void deleteAllByDataDate(LocalDate date);

        List<RegionStock> findAllByDataDate(LocalDate date);

        Optional<RegionStock> findByRegionAndStock(Region region, Stock stock);

        // 특정 지역의 모든 RegionStock 조회
        List<RegionStock> findByRegion_Id(Long regionId);

        // 여러 지역의 모든 RegionStock 조회 (배치 처리용)
        List<RegionStock> findByRegion_IdIn(List<Long> regionIds);

        // 여러 지역의 특정 날짜 데이터 조회
        List<RegionStock> findByRegion_IdInAndDataDate(List<Long> regionIds, LocalDate date);

        // 특정 지역의 특정 날짜 데이터 조회
        List<RegionStock> findByRegion_IdAndDataDate(Long regionId, LocalDate date);

        // 특정 지역-주식-날짜로 단건 조회 (집계시 중복 방지용)
        Optional<RegionStock> findByRegion_IdAndStock_IdAndDataDate(Long regionId, Long stockId, LocalDate date);

        // 특정 지역의 특정 날짜 데이터 중 인기도 상위 5개 조회
        @Query("SELECT rs FROM RegionStock rs " +
                        "WHERE rs.region.id = :regionId " +
                        "AND rs.dataDate = :date " +
                        "ORDER BY rs.popularityScore DESC")
        List<RegionStock> findTop5ByRegionIdAndDataDateOrderByPopularityScoreDesc(
                        @Param("regionId") Long regionId,
                        @Param("date") LocalDate date,
                        Pageable pageable);

        // 특정 지역의 최신 날짜 데이터 중 인기도 상위 N개 조회
        @Query("SELECT rs FROM RegionStock rs " +
                        "WHERE rs.region.id = :regionId " +
                        "AND rs.dataDate = (SELECT MAX(rs2.dataDate) FROM RegionStock rs2 WHERE rs2.region.id = :regionId) "
                        +
                        "ORDER BY rs.popularityScore DESC")
        List<RegionStock> findTopByRegionIdOrderByPopularityScoreDesc(
                        @Param("regionId") Long regionId,
                        Pageable pageable);

        // 특정 지역의 최신 데이터 날짜 조회
        @Query("SELECT MAX(rs.dataDate) FROM RegionStock rs WHERE rs.region.id = :regionId")
        LocalDate findLatestDataDateByRegionId(@Param("regionId") Long regionId);

        // 특정 지역과 날짜 기준으로 기존 데이터 삭제 (상향 집계 갱신용)
        @Modifying
        @Query("DELETE FROM RegionStock rs WHERE rs.region.id = :regionId AND rs.dataDate = :date")
        void deleteByRegionIdAndDataDate(@Param("regionId") Long regionId, @Param("date") LocalDate date);

        // 특정 지역의 특정 날짜 통계 집계
        @Query("SELECT COALESCE(SUM(rs.postCount), 0) as postCount, " +
                        "COALESCE(SUM(rs.commentCount), 0) as commentCount, " +
                        "COALESCE(SUM(rs.viewCount), 0) as viewCount " +
                        "FROM RegionStock rs " +
                        "WHERE rs.region.id = :regionId " +
                        "AND rs.dataDate = :date")
        RegionStockStats getRegionStatsForDate(
                        @Param("regionId") Long regionId,
                        @Param("date") LocalDate date);

        interface RegionStockStats {
                int getPostCount();

                int getCommentCount();

                int getViewCount();
        }

        // 지역별 포트폴리오 분석을 위한 집계 쿼리
        @Query("SELECT " +
                "COUNT(rs) as stockCount, " +
                "AVG(rs.popularityScore) as avgPopularityScore, " +
                "AVG(rs.trendScore) as avgTrendScore " +
                "FROM RegionStock rs " +
                "WHERE rs.region.id = :regionId " +
                "AND rs.dataDate = (SELECT MAX(rs2.dataDate) FROM RegionStock rs2 WHERE rs2.region.id = :regionId)")
        RegionalPortfolioStats getRegionalPortfolioStats(@Param("regionId") Long regionId);

        interface RegionalPortfolioStats {
                long getStockCount();
                Double getAvgPopularityScore();
                Double getAvgTrendScore();
        }

        // 지역별 인기 주식 TOP 5 조회 (포트폴리오 분석용)
        @Query("SELECT rs FROM RegionStock rs " +
                "JOIN FETCH rs.stock s " +
                "WHERE rs.region.id = :regionId " +
                "AND rs.dataDate = (SELECT MAX(rs2.dataDate) FROM RegionStock rs2 WHERE rs2.region.id = :regionId) " +
                "ORDER BY rs.popularityScore DESC")
        List<RegionStock> findTopPopularStocksByRegionId(@Param("regionId") Long regionId, Pageable pageable);
}