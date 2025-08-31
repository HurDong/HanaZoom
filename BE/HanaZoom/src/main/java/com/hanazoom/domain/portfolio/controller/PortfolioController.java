package com.hanazoom.domain.portfolio.controller;

import com.hanazoom.domain.portfolio.dto.PortfolioSummaryResponse;
import com.hanazoom.domain.portfolio.dto.PortfolioStockResponse;
import com.hanazoom.domain.portfolio.dto.TradeResult;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.service.PortfolioService;
import com.hanazoom.domain.portfolio.service.VirtualTradingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final VirtualTradingService virtualTradingService;

    // 포트폴리오 요약 정보 조회
    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryResponse> getPortfolioSummary(
            @AuthenticationPrincipal com.hanazoom.domain.member.entity.Member member) {

        try {
            log.info("포트폴리오 요약 조회 요청: 회원={}", member.getEmail());

            PortfolioSummaryResponse summary = portfolioService.getPortfolioSummaryByMemberId(member.getId());

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            log.error("포트폴리오 요약 조회 실패: 회원={}", member.getId(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    // 포트폴리오 보유 주식 목록 조회
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

    // 주식 매수
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

    // 주식 매도
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

    // 매수 요청 DTO
    public static class BuyStockRequest {
        private String stockSymbol;
        private int quantity;
        private BigDecimal price;

        // Getters and Setters
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

    // 매도 요청 DTO
    public static class SellStockRequest {
        private String stockSymbol;
        private int quantity;
        private BigDecimal price;

        // Getters and Setters
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

    // 거래 내역 조회
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

}
