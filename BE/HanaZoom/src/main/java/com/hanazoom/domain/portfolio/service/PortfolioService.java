package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.portfolio.dto.PortfolioSummaryResponse;
import com.hanazoom.domain.portfolio.dto.PortfolioStockResponse;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.repository.AccountRepository;
import com.hanazoom.domain.portfolio.repository.AccountBalanceRepository;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import com.hanazoom.domain.portfolio.repository.TradeHistoryRepository;
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
@Transactional(readOnly = true)
public class PortfolioService {

    private final AccountRepository accountRepository;
    private final AccountBalanceRepository accountBalanceRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final TradeHistoryRepository tradeHistoryRepository;

    // 회원 ID로 계좌 조회
    public Account getAccountByMemberId(java.util.UUID memberId) {
        return accountRepository.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + memberId));
    }

    // 회원 ID로 포트폴리오 요약 정보 조회
    public PortfolioSummaryResponse getPortfolioSummaryByMemberId(java.util.UUID memberId) {
        Account account = getAccountByMemberId(memberId);
        return getPortfolioSummary(account.getId());
    }

    // 포트폴리오 요약 정보 조회
    public PortfolioSummaryResponse getPortfolioSummary(Long accountId) {
        log.info("포트폴리오 요약 조회: 계좌={}", accountId);

        Account account = getAccount(accountId);
        AccountBalance balance = getAccountBalance(account);
        List<PortfolioStock> stocks = portfolioStockRepository.findHoldingStocksByAccountId(account.getId());

        // 각 주식의 현재가 설정 및 손익 계산
        BigDecimal actualTotalStockValue = BigDecimal.ZERO;
        BigDecimal actualTotalProfitLoss = BigDecimal.ZERO;
        BigDecimal totalStockInvestment = BigDecimal.ZERO;

        for (PortfolioStock stock : stocks) {
            // 임시로 평균 매수가를 현재가로 설정 (실제로는 실시간 주식 가격 API 사용)
            if (stock.getCurrentPrice() == null) {
                stock.updateCurrentPrice(stock.getAvgPurchasePrice());
            }

            // 손익 계산
            stock.updateCurrentValue();
            actualTotalStockValue = actualTotalStockValue.add(stock.getCurrentValue());
            actualTotalProfitLoss = actualTotalProfitLoss.add(stock.getProfitLoss());
            totalStockInvestment = totalStockInvestment.add(stock.getTotalPurchaseAmount());
        }

        // 포트폴리오 구성 계산
        BigDecimal totalCash = balance.getAvailableCash().add(balance.getSettlementCash())
                .add(balance.getWithdrawableCash());
        BigDecimal totalBalance = totalCash.add(actualTotalStockValue);

        // 수익률 계산: 주식 매수 금액 대비 손익률 (현금 제외)
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

    // 회원 ID로 포트폴리오 보유 주식 목록 조회
    public List<PortfolioStockResponse> getPortfolioStocksByMemberId(java.util.UUID memberId) {
        Account account = getAccountByMemberId(memberId);
        return getPortfolioStocks(account.getId());
    }

    // 포트폴리오 보유 주식 목록 조회
    public List<PortfolioStockResponse> getPortfolioStocks(Long accountId) {
        log.info("포트폴리오 보유 주식 조회: 계좌={}", accountId);

        Account account = getAccount(accountId);
        List<PortfolioStock> stocks = portfolioStockRepository.findHoldingStocksByAccountId(account.getId());
        BigDecimal totalStockValue = portfolioStockRepository.findTotalStockValueByAccountId(account.getId());

        return stocks.stream()
                .map(stock -> convertToPortfolioStockResponse(stock, totalStockValue))
                .collect(Collectors.toList());
    }

    // 거래 내역 조회
    public List<TradeHistory> getTradeHistory(Long accountId) {
        log.info("거래 내역 조회: 계좌={}", accountId);
        return tradeHistoryRepository.findByAccountIdOrderByTradeDateDescTradeTimeDesc(accountId);
    }

    // 포트폴리오 주식 응답 변환
    private PortfolioStockResponse convertToPortfolioStockResponse(PortfolioStock stock, BigDecimal totalStockValue) {
        BigDecimal allocationRate = totalStockValue.compareTo(BigDecimal.ZERO) > 0 ? stock.getCurrentValue()
                .divide(totalStockValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")) : BigDecimal.ZERO;

        String performanceStatus = stock.getProfitLossRate().compareTo(BigDecimal.ZERO) > 0 ? "상승"
                : stock.getProfitLossRate().compareTo(BigDecimal.ZERO) < 0 ? "하락" : "보합";

        return PortfolioStockResponse.builder()
                .id(stock.getId())
                .stockSymbol(stock.getStockSymbol())
                .stockName(getStockName(stock.getStockSymbol())) // 추후 Stock 엔티티 연동
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

    // 일일 수익률 계산 (간단한 예시)
    private BigDecimal calculateDailyReturn(Account account) {
        // 실제로는 전일 대비 수익률을 계산해야 함
        return BigDecimal.ZERO;
    }

    // 월간 수익률 계산 (간단한 예시)
    private BigDecimal calculateMonthlyReturn(Account account) {
        // 실제로는 월간 수익률을 계산해야 함
        return BigDecimal.ZERO;
    }

    // 연간 수익률 계산 (간단한 예시)
    private BigDecimal calculateYearlyReturn(Account account) {
        // 실제로는 연간 수익률을 계산해야 함
        return BigDecimal.ZERO;
    }

    // 종목명 조회 (간단한 예시)
    private String getStockName(String stockSymbol) {
        // 실제로는 Stock 엔티티에서 조회해야 함
        switch (stockSymbol) {
            case "005930":
                return "삼성전자";
            case "035420":
                return "NAVER";
            case "051910":
                return "LG화학";
            case "006400":
                return "삼성SDI";
            case "000660":
                return "SK하이닉스";
            case "207940":
                return "삼성바이오로직스";
            default:
                return "알 수 없음";
        }
    }

    // 계좌 조회
    private Account getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
    }

    // 계좌 잔고 조회
    private AccountBalance getAccountBalance(Account account) {
        return accountBalanceRepository.findLatestBalanceByAccountIdOrderByDateDesc(account.getId())
                .orElseThrow(() -> new IllegalArgumentException("계좌 잔고를 찾을 수 없습니다: " + account.getAccountNumber()));
    }
}
