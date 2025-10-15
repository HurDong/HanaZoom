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


    List<PortfolioStock> findByAccountId(Long accountId);


    Optional<PortfolioStock> findByAccountIdAndStockSymbol(Long accountId, String stockSymbol);


    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity > 0")
    List<PortfolioStock> findHoldingStocksByAccountId(@Param("accountId") Long accountId);


    @Query("SELECT COALESCE(ps.quantity, 0) FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.stockSymbol = :stockSymbol")
    Integer findQuantityByAccountIdAndStockSymbol(@Param("accountId") Long accountId,
            @Param("stockSymbol") String stockSymbol);


    @Query("SELECT COALESCE(SUM(ps.currentValue), 0) FROM PortfolioStock ps WHERE ps.accountId = :accountId")
    BigDecimal findTotalStockValueByAccountId(@Param("accountId") Long accountId);


    @Query("SELECT COALESCE(SUM(ps.profitLoss), 0) FROM PortfolioStock ps WHERE ps.accountId = :accountId")
    BigDecimal findTotalProfitLossByAccountId(@Param("accountId") Long accountId);


    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity > 0 ORDER BY ps.profitLossRate DESC")
    List<PortfolioStock> findTopPerformingStocksByAccountId(@Param("accountId") Long accountId);


    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity > 0 ORDER BY ps.profitLossRate ASC")
    List<PortfolioStock> findWorstPerformingStocksByAccountId(@Param("accountId") Long accountId);


    List<PortfolioStock> findByStockSymbol(String stockSymbol);


    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.accountId = :accountId AND ps.quantity = 0")
    List<PortfolioStock> findEmptyStocksByAccountId(@Param("accountId") Long accountId);


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


    @Query("SELECT ps FROM PortfolioStock ps " +
            "WHERE ps.accountId = :accountId AND ps.quantity > 0 " +
            "ORDER BY ps.currentValue DESC")
    List<PortfolioStock> findTopHoldingStocksByAccountId(@Param("accountId") Long accountId);
}
