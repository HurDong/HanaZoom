package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioStockRepository extends JpaRepository<PortfolioStock, Long> {

    // 계좌의 모든 보유 주식 조회
    List<PortfolioStock> findByAccountId(Long accountId);

    // 계좌의 특정 종목 보유 현황 조회
    Optional<PortfolioStock> findByAccountIdAndStockSymbol(Long accountId, String stockSymbol);

    // 계좌의 보유 주식이 있는 종목들만 조회
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity > 0")
    List<PortfolioStock> findHoldingStocksByAccountId(@Param("accountId") Long accountId);

    // 계좌의 특정 종목 보유 수량 조회
    @Query("SELECT COALESCE(ps.quantity, 0) FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.stockSymbol = :stockSymbol")
    Integer findQuantityByAccountIdAndStockSymbol(@Param("accountId") Long accountId,
            @Param("stockSymbol") String stockSymbol);

    // 계좌의 총 주식 평가금액 조회
    @Query("SELECT COALESCE(SUM(ps.currentValue), 0) FROM PortfolioStock ps WHERE ps.accountId = :accountId")
    BigDecimal findTotalStockValueByAccountId(@Param("accountId") Long accountId);

    // 계좌의 총 손익 조회
    @Query("SELECT COALESCE(SUM(ps.profitLoss), 0) FROM PortfolioStock ps WHERE ps.accountId = :accountId")
    BigDecimal findTotalProfitLossByAccountId(@Param("accountId") Long accountId);

    // 수익률이 높은 순으로 정렬
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity > 0 ORDER BY ps.profitLossRate DESC")
    List<PortfolioStock> findTopPerformingStocksByAccountId(@Param("accountId") Long accountId);

    // 손실률이 높은 순으로 정렬
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity > 0 ORDER BY ps.profitLossRate ASC")
    List<PortfolioStock> findWorstPerformingStocksByAccountId(@Param("accountId") Long accountId);

    // 특정 종목을 보유한 모든 계좌 조회
    List<PortfolioStock> findByStockSymbol(String stockSymbol);

    // 보유 수량이 0인 종목들 조회 (정리 대상)
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity = 0")
    List<PortfolioStock> findEmptyStocksByAccountId(@Param("accountId") Long accountId);

    // 사용자의 포트폴리오 집계 정보 조회 (지역별 비교용)
    @Query("SELECT " +
            "COUNT(ps) as stockCount, " +
            "COALESCE(SUM(ps.currentValue), 0) as totalValue, " +
            "COALESCE(AVG(ps.profitLossRate), 0) as avgProfitLossRate " +
            "FROM PortfolioStock ps " +
            "WHERE ps.accountId = :accountId AND ps.quantity > 0")
    UserPortfolioStats getUserPortfolioStats(@Param("accountId") Long accountId);

    interface UserPortfolioStats {
        long getStockCount();
        BigDecimal getTotalValue();
        BigDecimal getAvgProfitLossRate();
    }

    // 사용자의 상위 보유 주식 조회 (지역별 비교용)
    @Query("SELECT ps FROM PortfolioStock ps " +
            "WHERE ps.accountId = :accountId AND ps.quantity > 0 " +
            "ORDER BY ps.currentValue DESC")
    List<PortfolioStock> findTopHoldingStocksByAccountId(@Param("accountId") Long accountId);
}
