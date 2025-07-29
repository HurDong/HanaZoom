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

        // 특정 지역의 특정 날짜 데이터 조회
        List<RegionStock> findByRegion_IdAndDataDate(Long regionId, LocalDate date);

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
}