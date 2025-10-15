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


        List<RegionStock> findByRegion_Id(Long regionId);


        List<RegionStock> findByRegion_IdIn(List<Long> regionIds);


        List<RegionStock> findByRegion_IdInAndDataDate(List<Long> regionIds, LocalDate date);


        List<RegionStock> findByRegion_IdAndDataDate(Long regionId, LocalDate date);


        Optional<RegionStock> findByRegion_IdAndStock_IdAndDataDate(Long regionId, Long stockId, LocalDate date);


        @Query("SELECT rs FROM RegionStock rs " +
                        "WHERE rs.region.id = :regionId " +
                        "AND rs.dataDate = :date " +
                        "ORDER BY rs.popularityScore DESC")
        List<RegionStock> findTop5ByRegionIdAndDataDateOrderByPopularityScoreDesc(
                        @Param("regionId") Long regionId,
                        @Param("date") LocalDate date,
                        Pageable pageable);


        @Query("SELECT rs FROM RegionStock rs " +
                        "WHERE rs.region.id = :regionId " +
                        "AND rs.dataDate = (SELECT MAX(rs2.dataDate) FROM RegionStock rs2 WHERE rs2.region.id = :regionId) "
                        +
                        "ORDER BY rs.popularityScore DESC")
        List<RegionStock> findTopByRegionIdOrderByPopularityScoreDesc(
                        @Param("regionId") Long regionId,
                        Pageable pageable);


        @Query("SELECT MAX(rs.dataDate) FROM RegionStock rs WHERE rs.region.id = :regionId")
        LocalDate findLatestDataDateByRegionId(@Param("regionId") Long regionId);


        @Modifying
        @Query("DELETE FROM RegionStock rs WHERE rs.region.id = :regionId AND rs.dataDate = :date")
        void deleteByRegionIdAndDataDate(@Param("regionId") Long regionId, @Param("date") LocalDate date);


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


        @Query("SELECT rs FROM RegionStock rs " +
                "JOIN FETCH rs.stock s " +
                "WHERE rs.region.id = :regionId " +
                "AND rs.dataDate = (SELECT MAX(rs2.dataDate) FROM RegionStock rs2 WHERE rs2.region.id = :regionId) " +
                "ORDER BY rs.popularityScore DESC")
        List<RegionStock> findTopPopularStocksByRegionId(@Param("regionId") Long regionId, Pageable pageable);


        @Query("SELECT rs.stock as stock, SUM(rs.popularityScore) as totalPopularity " +
                "FROM RegionStock rs " +
                "WHERE rs.region.id = :regionId " +
                "GROUP BY rs.stock " +
                "ORDER BY totalPopularity DESC")
        List<RegionStockPopularityAgg> findTopPopularStocksAggregatedByRegion(
                @Param("regionId") Long regionId,
                Pageable pageable);

        interface RegionStockPopularityAgg {
                com.hanazoom.domain.stock.entity.Stock getStock();
                java.math.BigDecimal getTotalPopularity();
        }


        @Query("SELECT rs FROM RegionStock rs " +
                "WHERE rs.region.id = :regionId " +
                "AND rs.stock.id = :stockId " +
                "AND rs.dataDate = :date")
        RegionStock findByRegionIdAndStockIdAndDataDate(
                @Param("regionId") Long regionId,
                @Param("stockId") Long stockId,
                @Param("date") LocalDate date);


        @Query("SELECT rs FROM RegionStock rs " +
                "WHERE rs.region.id = :regionId " +
                "AND rs.stock.id = :stockId " +
                "ORDER BY rs.dataDate DESC")
        List<RegionStock> findByRegionIdAndStockId(
                @Param("regionId") Long regionId,
                @Param("stockId") Long stockId);
}