 package com.hanazoom.domain.portfolio.controller;

import com.hanazoom.domain.portfolio.dto.PortfolioSummaryResponse;
import com.hanazoom.domain.portfolio.dto.PortfolioStockResponse;
import com.hanazoom.domain.portfolio.dto.TradeResult;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.service.PortfolioService;
import com.hanazoom.domain.portfolio.service.VirtualTradingService;
import com.hanazoom.domain.consultation.repository.ConsultationRepository;
import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final VirtualTradingService virtualTradingService;
    private final ConsultationRepository consultationRepository;


    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryResponse> getPortfolioSummary(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {

        try {
            log.info("포트폴리오 요약 조회 요청: 회원={}", member.getEmail());

            PortfolioSummaryResponse summary = portfolioService.getPortfolioSummaryByMemberId(member.getId());

            return ResponseEntity.ok(summary);

        } catch (IllegalArgumentException e) {
            log.warn("포트폴리오 요약 조회 실패 - 계좌 없음: 회원={}, 오류={}", member.getId(), e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("포트폴리오 요약 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/stocks")
    public ResponseEntity<List<PortfolioStockResponse>> getPortfolioStocks(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {

        try {
            log.info("포트폴리오 보유 주식 조회 요청: 회원={}", member.getEmail());

            List<PortfolioStockResponse> stocks = portfolioService.getPortfolioStocksByMemberId(member.getId());

            return ResponseEntity.ok(stocks);

        } catch (Exception e) {
            log.error("포트폴리오 보유 주식 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/client/{clientId}/summary")
    public ResponseEntity<PortfolioSummaryResponse> getClientPortfolioSummary(
            @PathVariable String clientId,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member pbMember) {

        try {
            log.info("PB가 고객 포트폴리오 요약 조회: PB={}, 고객={}", pbMember.getEmail(), clientId);


            if (!pbMember.isActivePb()) {
                log.warn("PB 권한 없음: 회원={}", pbMember.getEmail());
                return ResponseEntity.status(403).build();
            }


            if (!hasConsultationRelationship(pbMember.getId(), UUID.fromString(clientId))) {
                log.warn("상담 관계 없음: PB={}, 고객={}", pbMember.getEmail(), clientId);
                return ResponseEntity.status(403).build();
            }

            PortfolioSummaryResponse summary = portfolioService.getPortfolioSummaryByMemberId(UUID.fromString(clientId));

            return ResponseEntity.ok(summary);

        } catch (IllegalArgumentException e) {
            log.warn("고객 포트폴리오 요약 조회 실패 - 계좌 없음: 고객={}, 오류={}", clientId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("고객 포트폴리오 요약 조회 실패: PB={}, 고객={}", pbMember.getEmail(), clientId, e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/client/{clientId}/stocks")
    public ResponseEntity<List<PortfolioStockResponse>> getClientPortfolioStocks(
            @PathVariable String clientId,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member pbMember) {

        try {
            log.info("PB가 고객 포트폴리오 보유 주식 조회: PB={}, 고객={}", pbMember.getEmail(), clientId);


            if (!pbMember.isActivePb()) {
                log.warn("PB 권한 없음: 회원={}", pbMember.getEmail());
                return ResponseEntity.status(403).build();
            }


            if (!hasConsultationRelationship(pbMember.getId(), UUID.fromString(clientId))) {
                log.warn("상담 관계 없음: PB={}, 고객={}", pbMember.getEmail(), clientId);
                return ResponseEntity.status(403).build();
            }

            List<PortfolioStockResponse> stocks = portfolioService.getPortfolioStocksByMemberId(UUID.fromString(clientId));

            return ResponseEntity.ok(stocks);

        } catch (Exception e) {
            log.error("고객 포트폴리오 보유 주식 조회 실패: PB={}, 고객={}", pbMember.getEmail(), clientId, e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/client/{clientId}/trades")
    public ResponseEntity<List<TradeHistory>> getClientTradeHistory(
            @PathVariable String clientId,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member pbMember) {

        try {
            log.info("PB가 고객 거래 내역 조회: PB={}, 고객={}", pbMember.getEmail(), clientId);


            if (!pbMember.isActivePb()) {
                log.warn("PB 권한 없음: 회원={}", pbMember.getEmail());
                return ResponseEntity.status(403).build();
            }


            if (!hasConsultationRelationship(pbMember.getId(), UUID.fromString(clientId))) {
                log.warn("상담 관계 없음: PB={}, 고객={}", pbMember.getEmail(), clientId);
                return ResponseEntity.status(403).build();
            }

            List<TradeHistory> trades = portfolioService.getTradeHistoryByMemberId(UUID.fromString(clientId));

            return ResponseEntity.ok(trades);

        } catch (Exception e) {
            log.error("고객 거래 내역 조회 실패: PB={}, 고객={}", pbMember.getEmail(), clientId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    private boolean hasConsultationRelationship(UUID pbId, UUID clientId) {
        try {

            List<com.hanazoom.domain.consultation.entity.Consultation> consultations = 
                consultationRepository.findByPbIdAndClientIdAndStatusIn(
                    pbId, 
                    clientId, 
                    List.of(ConsultationStatus.APPROVED, ConsultationStatus.IN_PROGRESS, ConsultationStatus.COMPLETED)
                );
            
            return !consultations.isEmpty();
        } catch (Exception e) {
            log.error("상담 관계 확인 실패: PB={}, 고객={}", pbId, clientId, e);
            return false;
        }
    }


    @PostMapping("/buy")
    public ResponseEntity<TradeResult> buyStock(
            @RequestBody BuyStockRequest request,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {

        try {
            log.info("주식 매수 요청: 종목={}, 수량={}, 가격={}, 회원={}",
                    request.getStockSymbol(), request.getQuantity(),
                    request.getPrice(), member.getEmail());

            Account account = portfolioService.getAccountByMemberId(member.getId());
            TradeResult result = virtualTradingService.buyStock(
                    account.getId(),
                    request.getStockSymbol(),
                    request.getQuantity(),
                    request.getPrice());

            return ResponseEntity.ok(result);

        } catch (VirtualTradingService.InsufficientFundsException e) {
            log.warn("매수 실패 - 예수금 부족: 종목={}", request.getStockSymbol());
            return ResponseEntity.badRequest()
                    .body(TradeResult.error("예수금이 부족합니다: " + e.getMessage()));

        } catch (Exception e) {
            log.error("주식 매수 실패: 종목={}", request.getStockSymbol(), e);
            return ResponseEntity.badRequest()
                    .body(TradeResult.error("주식 매수에 실패했습니다: " + e.getMessage()));
        }
    }


    @PostMapping("/sell")
    public ResponseEntity<TradeResult> sellStock(
            @RequestBody SellStockRequest request,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {

        try {
            log.info("주식 매도 요청: 종목={}, 수량={}, 가격={}, 회원={}",
                    request.getStockSymbol(), request.getQuantity(),
                    request.getPrice(), member.getEmail());

            Account account = portfolioService.getAccountByMemberId(member.getId());
            TradeResult result = virtualTradingService.sellStock(
                    account.getId(),
                    request.getStockSymbol(),
                    request.getQuantity(),
                    request.getPrice());

            return ResponseEntity.ok(result);

        } catch (VirtualTradingService.InsufficientQuantityException e) {
            log.warn("매도 실패 - 보유 수량 부족: 종목={}", request.getStockSymbol());
            return ResponseEntity.badRequest()
                    .body(TradeResult.error("매도 가능한 수량이 부족합니다: " + e.getMessage()));

        } catch (Exception e) {
            log.error("주식 매도 실패: 종목={}", request.getStockSymbol(), e);
            return ResponseEntity.badRequest()
                    .body(TradeResult.error("주식 매도에 실패했습니다: " + e.getMessage()));
        }
    }


    public static class BuyStockRequest {
        private String stockSymbol;
        private int quantity;
        private BigDecimal price;


        public String getStockSymbol() {
            return stockSymbol;
        }

        public void setStockSymbol(String stockSymbol) {
            this.stockSymbol = stockSymbol;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }
    }


    public static class SellStockRequest {
        private String stockSymbol;
        private int quantity;
        private BigDecimal price;


        public String getStockSymbol() {
            return stockSymbol;
        }

        public void setStockSymbol(String stockSymbol) {
            this.stockSymbol = stockSymbol;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }
    }


    @GetMapping("/trades")
    public ResponseEntity<List<TradeHistory>> getTradeHistory(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("거래 내역 조회 요청: 회원={}", member.getEmail());
            Account account = portfolioService.getAccountByMemberId(member.getId());
            List<TradeHistory> trades = portfolioService.getTradeHistory(account.getId());
            return ResponseEntity.ok(trades);
        } catch (Exception e) {
            log.error("거래 내역 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/trade-result")
    public ResponseEntity<TradeResult> getTradeResult(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("거래 결과 조회 요청: 회원={}", member.getEmail());

            TradeResult result = TradeResult.success("거래 결과 조회 성공");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("거래 결과 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/settlement-schedule")
    public ResponseEntity<Object> getSettlementSchedule(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("정산 일정 조회 요청: 회원={}", member.getEmail());

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("정산 일정 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/account")
    public ResponseEntity<Account> getAccountInfo(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("계좌 정보 조회 요청: 회원={}", member.getEmail());
            Account account = portfolioService.getAccountByMemberId(member.getId());
            return ResponseEntity.ok(account);
        } catch (Exception e) {
            log.error("계좌 정보 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/account/balance")
    public ResponseEntity<AccountBalance> getAccountBalance(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("계좌 잔고 조회 요청: 회원={}", member.getEmail());
            Account account = portfolioService.getAccountByMemberId(member.getId());
            AccountBalance balance = portfolioService.getAccountBalance(account.getId());
            return ResponseEntity.ok(balance);
        } catch (Exception e) {
            log.error("계좌 잔고 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/stock/{stockCode}")
    public ResponseEntity<Object> getStockInfo(
            @PathVariable String stockCode,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("주식 정보 조회 요청: 종목={}, 회원={}", stockCode, member.getEmail());

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("주식 정보 조회 실패: 종목={}, 회원={}", stockCode, member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/search-stocks")
    public ResponseEntity<List<Object>> searchStocks(
            @RequestParam String keyword,
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {
        try {
            log.info("주식 검색 요청: 키워드={}, 회원={}", keyword, member.getEmail());

            return ResponseEntity.ok(List.of());
        } catch (Exception e) {
            log.error("주식 검색 실패: 키워드={}, 회원={}", keyword, member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }

}
