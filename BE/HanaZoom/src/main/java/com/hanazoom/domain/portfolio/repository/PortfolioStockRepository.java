package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.entity.Account;
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
    List<PortfolioStock> findByAccount(Account account);

    // 계좌의 특정 종목 보유 현황 조회
    Optional<PortfolioStock> findByAccountAndStockSymbol(Account account, String stockSymbol);

    // 계좌의 보유 주식이 있는 종목들만 조회
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.account = :account AND ps.quantity > 0")
    List<PortfolioStock> findHoldingStocksByAccount(@Param("account") Account account);

    // 계좌의 특정 종목 보유 수량 조회
    @Query("SELECT COALESCE(ps.quantity, 0) FROM PortfolioStock ps WHERE ps.account = :account AND ps.stockSymbol = :stockSymbol")
    Integer findQuantityByAccountAndStockSymbol(@Param("account") Account account,
            @Param("stockSymbol") String stockSymbol);

    // 계좌의 총 주식 평가금액 조회
    @Query("SELECT COALESCE(SUM(ps.currentValue), 0) FROM PortfolioStock ps WHERE ps.account = :account")
    BigDecimal findTotalStockValueByAccount(@Param("account") Account account);

    // 계좌의 총 손익 조회
    @Query("SELECT COALESCE(SUM(ps.profitLoss), 0) FROM PortfolioStock ps WHERE ps.account = :account")
    BigDecimal findTotalProfitLossByAccount(@Param("account") Account account);

    // 수익률이 높은 순으로 정렬
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.account = :account AND ps.quantity > 0 ORDER BY ps.profitLossRate DESC")
    List<PortfolioStock> findTopPerformingStocksByAccount(@Param("account") Account account);

    // 손실률이 높은 순으로 정렬
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.account = :account AND ps.quantity > 0 ORDER BY ps.profitLossRate ASC")
    List<PortfolioStock> findWorstPerformingStocksByAccount(@Param("account") Account account);

    // 특정 종목을 보유한 모든 계좌 조회
    List<PortfolioStock> findByStockSymbol(String stockSymbol);

    // 보유 수량이 0인 종목들 조회 (정리 대상)
    @Query("SELECT ps FROM PortfolioStock ps WHERE ps.account = :account AND ps.quantity = 0")
    List<PortfolioStock> findEmptyStocksByAccount(@Param("account") Account account);
}
