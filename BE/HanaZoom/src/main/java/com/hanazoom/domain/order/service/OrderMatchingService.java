package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.order.repository.OrderRepository;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.entity.TradeHistory;
import com.hanazoom.domain.portfolio.entity.TradeType;
import com.hanazoom.domain.portfolio.repository.AccountBalanceRepository;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import com.hanazoom.domain.portfolio.repository.TradeHistoryRepository;
import com.hanazoom.domain.portfolio.service.PortfolioService;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.domain.stock.dto.OrderBookItem;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hanazoom.domain.order.event.OrderMatchingEvent;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderMatchingService {

    private final OrderRepository orderRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final AccountBalanceRepository accountBalanceRepository;
    private final PortfolioService portfolioService;
    private final StockService stockService;

    @EventListener
    public void handleOrderMatchingEvent(OrderMatchingEvent event) {
        processOrderMatching(event.getStockCode(), event.getCurrentPrice(), 
                           event.getAskOrders(), event.getBidOrders());
    }

    public void processOrderMatching(String stockCode, String currentPrice, 
                                   List<OrderBookItem> askOrders, List<OrderBookItem> bidOrders) {
        
        if (currentPrice == null || currentPrice.isEmpty()) {
            return;
        }

        BigDecimal currentPriceDecimal = new BigDecimal(currentPrice);
        

        processBuyOrders(stockCode, currentPriceDecimal);
        

        processSellOrders(stockCode, currentPriceDecimal);
    }

    private void processBuyOrders(String stockCode, BigDecimal currentPrice) {

        List<Order> pendingBuyOrders = orderRepository
            .findByStockSymbolAndOrderTypeAndStatusOrderByPriceDesc(stockCode);

        for (Order order : pendingBuyOrders) {

            if (currentPrice.compareTo(order.getPrice()) <= 0) {
                executeOrder(order, currentPrice, "현재가가 주문가격보다 유리하여 체결");
            }
        }
    }

    private void processSellOrders(String stockCode, BigDecimal currentPrice) {

        List<Order> pendingSellOrders = orderRepository
            .findByStockSymbolAndOrderTypeAndStatusOrderByPriceAsc(stockCode);

        for (Order order : pendingSellOrders) {

            if (currentPrice.compareTo(order.getPrice()) >= 0) {
                executeOrder(order, currentPrice, "현재가가 주문가격보다 유리하여 체결");
            }
        }
    }

    private void executeOrder(Order order, BigDecimal executionPrice, String reason) {
        try {

            order.fill(order.getQuantity(), executionPrice);
            orderRepository.save(order);


            updatePortfolio(order, executionPrice);


            sendExecutionNotification(order, executionPrice, reason);

            log.info("✅ 주문 체결 완료: orderId={}, stockCode={}, price={}, quantity={}, reason={}", 
                order.getId(), order.getStock().getSymbol(), executionPrice, order.getQuantity(), reason);

        } catch (Exception e) {
            log.error("❌ 주문 체결 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
        }
    }

    private void updatePortfolio(Order order, BigDecimal executionPrice) {
        try {
            String stockCode = order.getStock().getSymbol();
            UUID memberId = order.getMember().getId();
            Integer quantity = order.getQuantity();
            BigDecimal totalAmount = executionPrice.multiply(BigDecimal.valueOf(quantity));


            com.hanazoom.domain.portfolio.entity.Account account = portfolioService.getAccountByMemberId(memberId);
            

            Optional<PortfolioStock> existingPortfolioStock = portfolioStockRepository
                .findByAccountIdAndStockSymbol(account.getId(), stockCode);

            if (order.getOrderType() == Order.OrderType.BUY) {

                if (existingPortfolioStock.isPresent()) {
                    PortfolioStock portfolioStock = existingPortfolioStock.get();
                    portfolioStock.buy(quantity, executionPrice);
                    portfolioStockRepository.save(portfolioStock);
                } else {

                    PortfolioStock newPortfolioStock = PortfolioStock.builder()
                        .accountId(account.getId())
                        .stockSymbol(stockCode)
                        .quantity(quantity)
                        .avgPurchasePrice(executionPrice)
                        .totalPurchaseAmount(totalAmount)
                        .build();
                    newPortfolioStock.updateCurrentPrice(executionPrice);
                    portfolioStockRepository.save(newPortfolioStock);
                }
                

                BigDecimal[] fees = calculateFees(totalAmount, TradeType.BUY);
                BigDecimal totalCost = totalAmount.add(fees[0]).add(fees[1]); 
                

                saveTradeHistory(account.getId(), stockCode, TradeType.BUY, quantity, executionPrice, totalAmount, fees[0], fees[1]);
                

                updateAccountBalance(account.getId(), totalCost, TradeType.BUY);
                
                log.info("💰 매수 체결: {}주 × {}원 = {}원 차감", quantity, executionPrice, totalAmount);
                
            } else {

                if (existingPortfolioStock.isPresent()) {
                    PortfolioStock portfolioStock = existingPortfolioStock.get();
                    if (portfolioStock.hasQuantity(quantity)) {
                        portfolioStock.sell(quantity);
                        portfolioStockRepository.save(portfolioStock);
                        

                        BigDecimal[] fees = calculateFees(totalAmount, TradeType.SELL);
                        BigDecimal netAmount = totalAmount.subtract(fees[0]).subtract(fees[1]); 
                        

                        saveTradeHistory(account.getId(), stockCode, TradeType.SELL, quantity, executionPrice, totalAmount, fees[0], fees[1]);
                        

                        updateAccountBalance(account.getId(), netAmount, TradeType.SELL);
                        

                        if (portfolioStock.getQuantity() == 0) {
                            portfolioStockRepository.delete(portfolioStock);
                        }
                    } else {
                        log.warn("⚠️ 매도 수량 부족: 보유={}, 매도요청={}", portfolioStock.getQuantity(), quantity);
                        return;
                    }
                } else {
                    log.warn("⚠️ 매도할 주식이 없음: stockCode={}", stockCode);
                    return;
                }
                
                log.info("💰 매도 체결: {}주 × {}원 = {}원 증가", quantity, executionPrice, totalAmount);
            }

        } catch (Exception e) {
            log.error("❌ 포트폴리오 업데이트 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
        }
    }

    private void updateAccountBalance(Long accountId, BigDecimal tradeAmount, TradeType tradeType) {
        try {

            Optional<AccountBalance> latestBalanceOpt = accountBalanceRepository
                .findLatestBalanceByAccountIdOrderByDateDesc(accountId);
            
            if (latestBalanceOpt.isPresent()) {
                AccountBalance currentBalance = latestBalanceOpt.get();
                

                BigDecimal newAvailableCash;
                if (tradeType == TradeType.BUY) {
                    newAvailableCash = currentBalance.getAvailableCash().subtract(tradeAmount);
                } else {
                    newAvailableCash = currentBalance.getAvailableCash().add(tradeAmount);
                }
                

                currentBalance.setAvailableCash(newAvailableCash);
                currentBalance.calculateTotalBalance();
                currentBalance.setBalanceDate(LocalDate.now());
                
                accountBalanceRepository.save(currentBalance);
                
                log.info("💳 계좌 잔고 업데이트: 계좌={}, {} {}원, 잔고={}원", 
                    accountId, tradeType.getDescription(), tradeAmount, newAvailableCash);
                    
            } else {
                log.warn("⚠️ 계좌 잔고를 찾을 수 없음: 계좌={}", accountId);
            }
            
        } catch (Exception e) {
            log.error("❌ 계좌 잔고 업데이트 실패: 계좌={}, error={}", accountId, e.getMessage(), e);
        }
    }

    private BigDecimal[] calculateFees(BigDecimal totalAmount, TradeType tradeType) {

        BigDecimal commissionRate = new BigDecimal("0.00015");
        BigDecimal commission = totalAmount.multiply(commissionRate);
        if (commission.compareTo(new BigDecimal("15")) < 0) {
            commission = new BigDecimal("15");
        }
        

        BigDecimal tax = BigDecimal.ZERO;
        if (tradeType == TradeType.SELL) {
            tax = totalAmount.multiply(new BigDecimal("0.0023"));
        }
        
        return new BigDecimal[]{commission, tax};
    }

    private void saveTradeHistory(Long accountId, String stockCode, TradeType tradeType, 
                                 Integer quantity, BigDecimal executionPrice, BigDecimal totalAmount,
                                 BigDecimal commission, BigDecimal tax) {
        try {
            

            Optional<AccountBalance> latestBalanceOpt = accountBalanceRepository
                .findLatestBalanceByAccountIdOrderByDateDesc(accountId);
            BigDecimal balanceAfterTrade = latestBalanceOpt.map(AccountBalance::getAvailableCash)
                .orElse(BigDecimal.ZERO);
            Integer stockQuantityAfterTrade = quantity; 
            
            TradeHistory tradeHistory = TradeHistory.builder()
                .accountId(accountId)
                .stockSymbol(stockCode)
                .tradeType(tradeType)
                .tradeDate(LocalDate.now())
                .tradeTime(LocalTime.now())
                .quantity(quantity)
                .pricePerShare(executionPrice)
                .totalAmount(totalAmount)
                .commission(commission)
                .tax(tax)
                .balanceAfterTrade(balanceAfterTrade)
                .stockQuantityAfterTrade(stockQuantityAfterTrade)
                .tradeMemo(tradeType == TradeType.BUY ? "매수 체결" : "매도 체결")
                .build();
            
            tradeHistoryRepository.save(tradeHistory);
            
            log.info("📝 거래내역 저장 완료: 계좌={}, 종목={}, {} {}주, 체결가={}원", 
                accountId, stockCode, tradeType.getDescription(), quantity, executionPrice);
                
        } catch (Exception e) {
            log.error("❌ 거래내역 저장 실패: 계좌={}, 종목={}, error={}", accountId, stockCode, e.getMessage(), e);
        }
    }

    private void sendExecutionNotification(Order order, BigDecimal executionPrice, String reason) {
        try {

            String notification = String.format(
                "주문이 체결되었습니다. 종목: %s, %s %d주, 체결가: %s원, 사유: %s",
                order.getStock().getName(),
                order.getOrderType() == Order.OrderType.BUY ? "매수" : "매도",
                order.getQuantity(),
                executionPrice.toPlainString(),
                reason
            );


            log.info("주문 체결 알림: 사용자={}, 주문={}, 알림={}", 
                order.getMember().getId(), order.getId(), notification);

        } catch (Exception e) {
            log.error("❌ 체결 알림 전송 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
        }
    }

    public void executeMarketOrder(Order order, BigDecimal currentPrice) {
        if (order.getOrderMethod() == Order.OrderMethod.MARKET) {
            executeOrder(order, currentPrice, "시장가 주문 즉시 체결");
        }
    }
}