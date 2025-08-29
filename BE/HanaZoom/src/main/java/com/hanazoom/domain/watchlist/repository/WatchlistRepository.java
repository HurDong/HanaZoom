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

        // 회원의 모든 관심종목 조회 (활성화된 것만)
        List<Watchlist> findByMember_IdAndIsActiveTrue(UUID memberId);

        // 회원의 특정 종목 관심종목 여부 확인
        Optional<Watchlist> findByMember_IdAndStock_SymbolAndIsActiveTrue(UUID memberId, String stockSymbol);

        // 회원의 관심종목 개수 조회
        long countByMember_IdAndIsActiveTrue(UUID memberId);

        // 특정 종목을 관심종목으로 등록한 회원 수 조회
        long countByStock_SymbolAndIsActiveTrue(String stockSymbol);

        // 가격 알림이 필요한 관심종목들 조회
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

        // 회원의 관심종목 존재 여부 확인
        boolean existsByMember_IdAndStock_SymbolAndIsActiveTrue(UUID memberId, String stockSymbol);

        // 회원의 관심종목 삭제 (소프트 삭제)
        @Modifying
        @Transactional
        @Query("UPDATE Watchlist w SET w.isActive = false WHERE w.member.id = :memberId AND w.stock.symbol = :stockSymbol")
        void deactivateByMemberIdAndStockSymbol(@Param("memberId") UUID memberId,
                        @Param("stockSymbol") String stockSymbol);
}
