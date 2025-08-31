package com.hanazoom.domain.portfolio.service;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.repository.AccountRepository;
import com.hanazoom.domain.portfolio.repository.AccountBalanceRepository;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@Profile("dev")
@RequiredArgsConstructor
@Transactional
public class AutoAccountCreationService {

    private final AccountRepository accountRepository;
    private final AccountBalanceRepository accountBalanceRepository;
    private final PortfolioStockRepository portfolioStockRepository;

    // 회원가입 시 자동 계좌 생성
    public void createAccountForNewMember(Member member) {
        log.info("새 회원을 위한 자동 계좌 생성 시작: {}", member.getEmail());

        try {
            // 계좌 생성
            Account account = createAccount(member);
            log.info("계좌 생성 완료: {}", account.getAccountNumber());

            // 초기 잔고 설정 (1억원)
            createInitialBalance(account);
            log.info("초기 잔고 설정 완료: 100,000,000원");

            // 기본 포트폴리오 생성 (선택사항)
            createDefaultPortfolio(account);
            log.info("기본 포트폴리오 생성 완료");

            log.info("자동 계좌 생성 완료: 회원={}, 계좌번호={}", member.getEmail(), account.getAccountNumber());

        } catch (Exception e) {
            log.error("자동 계좌 생성 실패: 회원={}", member.getEmail(), e);
            throw new RuntimeException("계좌 생성 중 오류가 발생했습니다.", e);
        }
    }

    private Account createAccount(Member member) {
        Account account = Account.builder()
                .member(member)
                .accountNumber(generateAccountNumber(member))
                .accountName("하나증권 계좌")
                .accountType(com.hanazoom.domain.portfolio.entity.AccountType.STOCK)
                .broker("하나증권")
                .isMainAccount(true)
                .createdDate(LocalDate.now())
                .build();

        return accountRepository.save(account);
    }

    private void createInitialBalance(Account account) {
        BigDecimal initialAmount = new BigDecimal("100000000"); // 1억원

        AccountBalance balance = AccountBalance.builder()
                .accountId(account.getId())
                .balanceDate(LocalDate.now())
                .availableCash(initialAmount) // 즉시 사용 가능
                .settlementCash(BigDecimal.ZERO) // 정산 대기
                .withdrawableCash(BigDecimal.ZERO) // 인출 가능
                .frozenCash(BigDecimal.ZERO) // 동결 현금
                .totalStockValue(BigDecimal.ZERO) // 주식 평가금액
                .totalProfitLoss(BigDecimal.ZERO) // 총 손익
                .totalProfitLossRate(BigDecimal.ZERO) // 손익률
                .build();

        balance.calculateTotalBalance();
        accountBalanceRepository.save(balance);
    }

    private void createDefaultPortfolio(Account account) {
        // 기본 관심종목 설정 (빈 포트폴리오)
        // 사용자가 직접 구매할 수 있도록 초기에는 빈 상태로 유지
        log.info("기본 포트폴리오는 빈 상태로 생성됩니다.");
    }

    private String generateAccountNumber(Member member) {
        // 계좌번호 생성 규칙: HANA + 회원ID의 마지막 8자리 + 랜덤 4자리
        String memberIdStr = member.getId().toString();
        String lastEightDigits = memberIdStr.length() > 8 ? memberIdStr.substring(memberIdStr.length() - 8)
                : String.format("%08d", Math.abs(memberIdStr.hashCode() % 100000000));

        // 4자리 랜덤 숫자 생성 (1000-9999)
        int randomNum = (int) (Math.random() * 9000) + 1000;

        return "HANA" + lastEightDigits + randomNum;
    }

    // 테스트용 포트폴리오 생성 (선택사항)
    public void createTestPortfolio(Account account) {
        log.info("테스트 포트폴리오 생성 시작: 계좌={}", account.getAccountNumber());

        // 인기 종목들로 기본 포트폴리오 구성
        List<TestStockData> defaultStocks = Arrays.asList(
                new TestStockData("005930", "삼성전자", 100, new BigDecimal("70000"), new BigDecimal("71500")),
                new TestStockData("035420", "NAVER", 50, new BigDecimal("180000"), new BigDecimal("185000")),
                new TestStockData("051910", "LG화학", 200, new BigDecimal("450000"), new BigDecimal("470000")),
                new TestStockData("006400", "삼성SDI", 150, new BigDecimal("320000"), new BigDecimal("300000")),
                new TestStockData("000660", "SK하이닉스", 80, new BigDecimal("120000"), new BigDecimal("125000")));

        defaultStocks.forEach(stock -> {
            PortfolioStock portfolioStock = PortfolioStock.builder()
                    .accountId(account.getId())
                    .stockSymbol(stock.symbol)
                    .quantity(stock.quantity)
                    .avgPurchasePrice(stock.avgPrice)
                    .totalPurchaseAmount(stock.avgPrice.multiply(BigDecimal.valueOf(stock.quantity)))
                    .build();

            // 현재가 설정 및 평가 정보 계산
            portfolioStock.updateCurrentPrice(stock.currentPrice);

            portfolioStockRepository.save(portfolioStock);
        });

        log.info("테스트 포트폴리오 생성 완료: {}개 종목", defaultStocks.size());
    }

    // 테스트용 주식 데이터 클래스
    public static class TestStockData {
        public final String symbol;
        public final String name;
        public final int quantity;
        public final BigDecimal avgPrice;
        public final BigDecimal currentPrice;

        public TestStockData(String symbol, String name, int quantity,
                BigDecimal avgPrice, BigDecimal currentPrice) {
            this.symbol = symbol;
            this.name = name;
            this.quantity = quantity;
            this.avgPrice = avgPrice;
            this.currentPrice = currentPrice;
        }
    }
}
