package com.hanazoom.domain.watchlist.repository;

import com.hanazoom.domain.watchlist.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {


        List<Watchlist> findByMember_IdAndIsActiveTrue(UUID memberId);


        Optional<Watchlist> findByMember_IdAndStock_SymbolAndIsActiveTrue(UUID memberId, String stockSymbol);


        long countByMember_IdAndIsActiveTrue(UUID memberId);


        long countByStock_SymbolAndIsActiveTrue(String stockSymbol);


        @Query("SELECT w FROM Watchlist w " +
                        "WHERE w.isActive = true " +
                        "AND w.alertPrice IS NOT NULL " +
                        "AND w.alertType = 'ABOVE' " +
                        "AND w.alertPrice <= :currentPrice")
        List<Watchlist> findWatchlistsNeedingAboveAlert(@Param("currentPrice") BigDecimal currentPrice);

        @Query("SELECT w FROM Watchlist w " +
                        "WHERE w.isActive = true " +
                        "AND w.alertPrice IS NOT NULL " +
                        "AND w.alertType = 'BELOW' " +
                        "AND w.alertPrice >= :currentPrice")
        List<Watchlist> findWatchlistsNeedingBelowAlert(@Param("currentPrice") BigDecimal currentPrice);

        @Query("SELECT w FROM Watchlist w " +
                        "WHERE w.isActive = true " +
                        "AND w.alertPrice IS NOT NULL " +
                        "AND w.alertType = 'BOTH' " +
                        "AND w.alertPrice = :currentPrice")
        List<Watchlist> findWatchlistsNeedingExactAlert(@Param("currentPrice") BigDecimal currentPrice);


        boolean existsByMember_IdAndStock_SymbolAndIsActiveTrue(UUID memberId, String stockSymbol);


        @Modifying
        @Transactional
        @Query("UPDATE Watchlist w SET w.isActive = false WHERE w.member.id = :memberId AND w.stock.symbol = :stockSymbol")
        void deactivateByMemberIdAndStockSymbol(@Param("memberId") UUID memberId,
                        @Param("stockSymbol") String stockSymbol);
}
