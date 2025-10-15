package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.portfolio.entity.*;
import com.hanazoom.domain.portfolio.repository.*;
import com.hanazoom.domain.portfolio.dto.TradeResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VirtualTradingService {

    private final AccountRepository accountRepository;
    private final AccountBalanceRepository accountBalanceRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final SettlementScheduleRepository settlementScheduleRepository;


    public TradeResult buyStock(Long accountId, String stockSymbol, int quantity, BigDecimal price) {
        log.info("매수 요청: 계좌={}, 종목={}, 수량={}, 가격={}", accountId, stockSymbol, quantity, price);

        try {
            Account account = getAccount(accountId);
            AccountBalance balance = getAccountBalance(account);


            BigDecimal requiredAmount = price.multiply(BigDecimal.valueOf(quantity));
            BigDecimal commission = calculateCommission(requiredAmount);
            BigDecimal totalCost = requiredAmount.add(commission);

            if (balance.getAvailableCash().compareTo(totalCost) < 0) {
                throw new InsufficientFundsException("사용 가능한 현금이 부족합니다. 필요: " +
                        formatCurrency(totalCost) + ", 보유: " + formatCurrency(balance.getAvailableCash()));
            }


            balance.setAvailableCash(balance.getAvailableCash().subtract(totalCost));
            balance.calculateTotalBalance();
            accountBalanceRepository.save(balance);


            PortfolioStock portfolioStock = getOrCreatePortfolioStock(account, stockSymbol);
            portfolioStock.buy(quantity, price);
            portfolioStockRepository.save(portfolioStock);


            TradeHistory tradeHistory = createTradeHistory(account, stockSymbol, TradeType.BUY,
                    quantity, price, requiredAmount, commission, balance.getAvailableCash(),
                    portfolioStock.getQuantity());
            tradeHistoryRepository.save(tradeHistory);


            updateAccountBalance(account);

            log.info("매수 완료: 계좌={}, 종목={}, 수량={}, 총비용={}",
                    accountId, stockSymbol, quantity, formatCurrency(totalCost));

            return TradeResult.success("매수 완료", tradeHistory);

        } catch (Exception e) {
            log.error("매수 처리 실패: 계좌={}, 종목={}", accountId, stockSymbol, e);
            throw e;
        }
    }


    public TradeResult sellStock(Long accountId, String stockSymbol, int quantity, BigDecimal price) {
        log.info("매도 요청: 계좌={}, 종목={}, 수량={}, 가격={}", accountId, stockSymbol, quantity, price);

        try {
            Account account = getAccount(accountId);
            PortfolioStock portfolioStock = getPortfolioStock(account, stockSymbol);


            if (portfolioStock.getAvailableQuantity() < quantity) {
                throw new InsufficientQuantityException("매도 가능한 수량이 부족합니다. 요청: " +
                        quantity + ", 보유: " + portfolioStock.getAvailableQuantity());
            }


            BigDecimal sellAmount = price.multiply(BigDecimal.valueOf(quantity));
            BigDecimal commission = calculateCommission(sellAmount);
            BigDecimal netAmount = sellAmount.subtract(commission);


            AccountBalance balance = getAccountBalance(account);
            balance.setSettlementCash(balance.getSettlementCash().add(netAmount));
            balance.calculateTotalBalance();
            accountBalanceRepository.save(balance);


            createSettlementSchedule(account, netAmount, LocalDate.now());


            portfolioStock.sell(quantity);
            portfolioStockRepository.save(portfolioStock);


            TradeHistory tradeHistory = createTradeHistory(account, stockSymbol, TradeType.SELL,
                    quantity, price, sellAmount, commission, balance.getAvailableCash(), portfolioStock.getQuantity());
            tradeHistoryRepository.save(tradeHistory);


            updateAccountBalance(account);

            log.info("매도 완료: 계좌={}, 종목={}, 수량={}, 정산금액={}",
                    accountId, stockSymbol, quantity, formatCurrency(netAmount));

            return TradeResult.success("매도 완료 - 정산일: " +
                    calculateBusinessDaysAfter(LocalDate.now(), 3)
                            .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                    tradeHistory);

        } catch (Exception e) {
            log.error("매도 처리 실패: 계좌={}, 종목={}", accountId, stockSymbol, e);
            throw e;
        }
    }


    private BigDecimal calculateCommission(BigDecimal amount) {

        BigDecimal commission = amount.multiply(new BigDecimal("0.00015"));
        return commission.compareTo(new BigDecimal("100")) < 0 ? new BigDecimal("100") : commission;
    }


    private void createSettlementSchedule(Account account, BigDecimal amount, LocalDate tradeDate) {
        AccountBalance balance = getAccountBalance(account);

        SettlementSchedule schedule = SettlementSchedule.builder()
                .accountBalanceId(balance.getId())
                .settlementAmount(amount)
                .tradeDate(tradeDate)
                .build();

        settlementScheduleRepository.save(schedule);
    }


    private LocalDate calculateBusinessDaysAfter(LocalDate startDate, int businessDays) {
        LocalDate result = startDate;
        int addedDays = 0;

        while (addedDays < businessDays) {
            result = result.plusDays(1);
            if (result.getDayOfWeek() != java.time.DayOfWeek.SATURDAY &&
                    result.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
                addedDays++;
            }
        }
        return result;
    }


    private TradeHistory createTradeHistory(Account account, String stockSymbol, TradeType tradeType,
            int quantity, BigDecimal price, BigDecimal totalAmount,
            BigDecimal commission, BigDecimal balanceAfterTrade, int stockQuantityAfterTrade) {
        return TradeHistory.builder()
                .accountId(account.getId())
                .stockSymbol(stockSymbol)
                .tradeType(tradeType)
                .tradeDate(LocalDate.now())
                .tradeTime(LocalTime.now())
                .quantity(quantity)
                .pricePerShare(price)
                .totalAmount(totalAmount)
                .commission(commission)
                .tax(BigDecimal.ZERO)
                .balanceAfterTrade(balanceAfterTrade)
                .stockQuantityAfterTrade(stockQuantityAfterTrade)
                .build();
    }


    private Account getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
    }


    private AccountBalance getAccountBalance(Account account) {
        return accountBalanceRepository.findLatestBalanceByAccountIdOrderByDateDesc(account.getId())
                .orElseThrow(() -> new IllegalArgumentException("계좌 잔고를 찾을 수 없습니다: " + account.getAccountNumber()));
    }


    private PortfolioStock getOrCreatePortfolioStock(Account account, String stockSymbol) {
        return portfolioStockRepository.findByAccountIdAndStockSymbol(account.getId(), stockSymbol)
                .orElseGet(() -> PortfolioStock.builder()
                        .accountId(account.getId())
                        .stockSymbol(stockSymbol)
                        .quantity(0)
                        .avgPurchasePrice(BigDecimal.ZERO)
                        .totalPurchaseAmount(BigDecimal.ZERO)
                        .build());
    }


    private PortfolioStock getPortfolioStock(Account account, String stockSymbol) {
        return portfolioStockRepository.findByAccountIdAndStockSymbol(account.getId(), stockSymbol)
                .orElseThrow(() -> new IllegalArgumentException("보유 종목을 찾을 수 없습니다: " + stockSymbol));
    }


    private void updateAccountBalance(Account account) {

        BigDecimal totalStockValue = portfolioStockRepository.findTotalStockValueByAccountId(account.getId());
        BigDecimal totalProfitLoss = portfolioStockRepository.findTotalProfitLossByAccountId(account.getId());

        AccountBalance balance = getAccountBalance(account);


        List<PortfolioStock> stocks = portfolioStockRepository.findHoldingStocksByAccountId(account.getId());
        BigDecimal totalStockInvestment = stocks.stream()
                .map(PortfolioStock::getTotalPurchaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfitLossRate = BigDecimal.ZERO;
        if (totalStockInvestment.compareTo(BigDecimal.ZERO) > 0) {
            totalProfitLossRate = totalProfitLoss
                    .divide(totalStockInvestment, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        balance.updateStockValue(totalStockValue, totalProfitLoss, totalProfitLossRate);
        accountBalanceRepository.save(balance);
    }


    private String formatCurrency(BigDecimal amount) {
        return amount != null ? amount.toString() : "0";
    }


    public static class InsufficientFundsException extends RuntimeException {
        public InsufficientFundsException(String message) {
            super(message);
        }
    }

    public static class InsufficientQuantityException extends RuntimeException {
        public InsufficientQuantityException(String message) {
            super(message);
        }
    }
}
