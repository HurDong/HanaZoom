package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.portfolio.dto.PortfolioSummaryResponse;
import com.hanazoom.domain.portfolio.dto.PortfolioStockResponse;
import com.hanazoom.domain.stock.repository.StockRepository;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.repository.AccountRepository;
import com.hanazoom.domain.portfolio.repository.AccountBalanceRepository;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import com.hanazoom.domain.portfolio.repository.TradeHistoryRepository;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.domain.stock.dto.StockPriceResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final AccountRepository accountRepository;
    private final AccountBalanceRepository accountBalanceRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final StockRepository stockRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final StockService stockService;


    @Transactional(readOnly = true)
    public Account getAccountByMemberId(java.util.UUID memberId) {
        return accountRepository.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + memberId));
    }


    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolioSummaryByMemberId(java.util.UUID memberId) {
        Account account = getAccountByMemberId(memberId);
        return getPortfolioSummary(account.getId());
    }


    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolioSummary(Long accountId) {
        log.info("포트폴리오 요약 조회: 계좌={}", accountId);

        Account account = getAccount(accountId);
        AccountBalance balance = getAccountBalance(account);
        List<PortfolioStock> stocks = portfolioStockRepository.findHoldingStocksByAccountId(account.getId());


        BigDecimal actualTotalStockValue = BigDecimal.ZERO;
        BigDecimal actualTotalProfitLoss = BigDecimal.ZERO;
        BigDecimal totalStockInvestment = BigDecimal.ZERO;

        for (PortfolioStock stock : stocks) {

            updateStockCurrentPrice(stock);


            stock.updateCurrentValue();
            actualTotalStockValue = actualTotalStockValue.add(stock.getCurrentValue());
            actualTotalProfitLoss = actualTotalProfitLoss.add(stock.getProfitLoss());
            totalStockInvestment = totalStockInvestment.add(stock.getTotalPurchaseAmount());
        }


        BigDecimal totalCash = balance.getAvailableCash().add(balance.getSettlementCash())
                .add(balance.getWithdrawableCash());
        BigDecimal totalBalance = totalCash.add(actualTotalStockValue);


        BigDecimal actualTotalProfitLossRate = BigDecimal.ZERO;
        if (totalStockInvestment.compareTo(BigDecimal.ZERO) > 0) {
            actualTotalProfitLossRate = actualTotalProfitLoss
                    .divide(totalStockInvestment, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        BigDecimal stockAllocationRate = totalBalance.compareTo(BigDecimal.ZERO) > 0
                ? actualTotalStockValue.divide(totalBalance, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                : BigDecimal.ZERO;

        BigDecimal cashAllocationRate = totalBalance.compareTo(BigDecimal.ZERO) > 0
                ? totalCash.divide(totalBalance, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                : BigDecimal.ZERO;

        return PortfolioSummaryResponse.builder()
                .accountId(accountId)
                .accountNumber(account.getAccountNumber())
                .accountName(account.getAccountName())
                .balanceDate(balance.getBalanceDate())
                .availableCash(balance.getAvailableCash())
                .settlementCash(balance.getSettlementCash())
                .withdrawableCash(balance.getWithdrawableCash())
                .frozenCash(balance.getFrozenCash())
                .totalCash(totalCash)
                .totalStockValue(actualTotalStockValue)
                .totalProfitLoss(actualTotalProfitLoss)
                .totalProfitLossRate(actualTotalProfitLossRate)
                .totalBalance(totalBalance)
                .totalStockCount(stocks.size())
                .stockAllocationRate(stockAllocationRate)
                .cashAllocationRate(cashAllocationRate)
                .dailyReturn(calculateDailyReturn(account))
                .monthlyReturn(calculateMonthlyReturn(account))
                .yearlyReturn(calculateYearlyReturn(account))
                .build();
    }


    @Transactional(readOnly = true)
    public List<PortfolioStockResponse> getPortfolioStocksByMemberId(java.util.UUID memberId) {
        Account account = getAccountByMemberId(memberId);
        return getPortfolioStocks(account.getId());
    }


    @Transactional(readOnly = true)
    public List<PortfolioStockResponse> getPortfolioStocks(Long accountId) {
        log.info("포트폴리오 보유 주식 조회: 계좌={}", accountId);

        Account account = getAccount(accountId);
        List<PortfolioStock> stocks = portfolioStockRepository.findHoldingStocksByAccountId(account.getId());
        

        for (PortfolioStock stock : stocks) {
            updateStockCurrentPrice(stock);
            stock.updateCurrentValue();
        }
        
        BigDecimal totalStockValue = portfolioStockRepository.findTotalStockValueByAccountId(account.getId());

        return stocks.stream()
                .map(stock -> convertToPortfolioStockResponse(stock, totalStockValue))
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<TradeHistory> getTradeHistory(Long accountId) {
        log.info("거래 내역 조회: 계좌={}", accountId);
        return tradeHistoryRepository.findByAccountIdOrderByTradeDateDescTradeTimeDesc(accountId);
    }


    @Transactional(readOnly = true)
    public List<TradeHistory> getTradeHistoryByMemberId(java.util.UUID memberId) {
        Account account = getAccountByMemberId(memberId);
        return getTradeHistory(account.getId());
    }


    private PortfolioStockResponse convertToPortfolioStockResponse(PortfolioStock stock, BigDecimal totalStockValue) {
        BigDecimal allocationRate = totalStockValue.compareTo(BigDecimal.ZERO) > 0 ? stock.getCurrentValue()
                .divide(totalStockValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")) : BigDecimal.ZERO;

        String performanceStatus = stock.getProfitLossRate().compareTo(BigDecimal.ZERO) > 0 ? "상승"
                : stock.getProfitLossRate().compareTo(BigDecimal.ZERO) < 0 ? "하락" : "보합";

        return PortfolioStockResponse.builder()
                .id(stock.getId())
                .stockSymbol(stock.getStockSymbol())
                .stockName(getStockName(stock.getStockSymbol())) 
                .quantity(stock.getQuantity())
                .availableQuantity(stock.getAvailableQuantity())
                .frozenQuantity(stock.getFrozenQuantity())
                .avgPurchasePrice(stock.getAvgPurchasePrice())
                .totalPurchaseAmount(stock.getTotalPurchaseAmount())
                .currentPrice(stock.getCurrentPrice())
                .currentValue(stock.getCurrentValue())
                .profitLoss(stock.getProfitLoss())
                .profitLossRate(stock.getProfitLossRate())
                .firstPurchaseDate(stock.getFirstPurchaseDate())
                .lastPurchaseDate(stock.getLastPurchaseDate())
                .lastSaleDate(stock.getLastSaleDate())
                .allocationRate(allocationRate)
                .isProfitable(stock.isProfitable())
                .performanceStatus(performanceStatus)
                .build();
    }


    private BigDecimal calculateDailyReturn(Account account) {

        return BigDecimal.ZERO;
    }


    private BigDecimal calculateMonthlyReturn(Account account) {

        return BigDecimal.ZERO;
    }


    private BigDecimal calculateYearlyReturn(Account account) {

        return BigDecimal.ZERO;
    }


    private String getStockName(String stockSymbol) {
        return stockRepository.findBySymbol(stockSymbol)
                .map(com.hanazoom.domain.stock.entity.Stock::getName)
                .orElse("알 수 없음");
    }


    private Account getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
    }


    public AccountBalance getAccountBalance(Long accountId) {
        return accountBalanceRepository.findLatestBalanceByAccountIdOrderByDateDesc(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌 잔고를 찾을 수 없습니다: " + accountId));
    }
    

    private AccountBalance getAccountBalance(Account account) {
        return getAccountBalance(account.getId());
    }

    @Transactional
    public void updateStockCurrentPrice(PortfolioStock portfolioStock) {
        try {

            StockPriceResponse priceResponse = stockService.getRealTimePrice(portfolioStock.getStockSymbol());
            
            if (priceResponse != null && priceResponse.getCurrentPrice() != null) {
                BigDecimal currentPrice = new BigDecimal(priceResponse.getCurrentPrice());
                portfolioStock.updateCurrentPrice(currentPrice);
                
                log.debug("📈 실시간 가격 업데이트: 종목={}, 현재가={}원", 
                    portfolioStock.getStockSymbol(), currentPrice);
            } else {

                log.warn("⚠️ 실시간 가격 조회 실패: 종목={}, 기존 가격 유지", 
                    portfolioStock.getStockSymbol());
            }
            
        } catch (Exception e) {

            log.warn("⚠️ 실시간 가격 업데이트 실패: 종목={}, error={}", 
                portfolioStock.getStockSymbol(), e.getMessage());
        }
    }
}
