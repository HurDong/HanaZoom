package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.order.repository.OrderRepository;
import com.hanazoom.domain.portfolio.entity.PortfolioStock;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 호가창 기반 주문 매칭 서비스
 * 
 * 체결 로직:
 * - 매수 주문: 현재가가 주문가격보다 낮거나 같을 때 체결
 * - 매도 주문: 현재가가 주문가격보다 높거나 같을 때 체결
 * - 호가창에서 가장 하위 우선순위로 처리 (즉시 체결)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderMatchingService {

    private final OrderRepository orderRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final PortfolioService portfolioService;
    private final StockService stockService;

    /**
     * 주문 매칭 이벤트 리스너
     */
    @EventListener
    public void handleOrderMatchingEvent(OrderMatchingEvent event) {
        processOrderMatching(event.getStockCode(), event.getCurrentPrice(), 
                           event.getAskOrders(), event.getBidOrders());
    }

    /**
     * 실시간 가격 변동에 따른 주문 체결 처리
     * 
     * @param stockCode 종목코드
     * @param currentPrice 현재가
     * @param askOrders 매도호가 (낮은 가격부터)
     * @param bidOrders 매수호가 (높은 가격부터)
     */
    public void processOrderMatching(String stockCode, String currentPrice, 
                                   List<OrderBookItem> askOrders, List<OrderBookItem> bidOrders) {
        
        if (currentPrice == null || currentPrice.isEmpty()) {
            return;
        }

        BigDecimal currentPriceDecimal = new BigDecimal(currentPrice);
        
        // 1. 매수 주문 체결 처리 (현재가가 주문가격보다 낮거나 같을 때)
        processBuyOrders(stockCode, currentPriceDecimal);
        
        // 2. 매도 주문 체결 처리 (현재가가 주문가격보다 높거나 같을 때)
        processSellOrders(stockCode, currentPriceDecimal);
    }

    /**
     * 매수 주문 체결 처리
     * 현재가가 주문가격보다 낮거나 같으면 체결
     */
    private void processBuyOrders(String stockCode, BigDecimal currentPrice) {
        // PENDING 상태의 매수 주문들을 가격 내림차순으로 조회
        List<Order> pendingBuyOrders = orderRepository
            .findByStockSymbolAndOrderTypeAndStatusOrderByPriceDesc(stockCode);

        for (Order order : pendingBuyOrders) {
            // 현재가가 주문가격보다 낮거나 같으면 체결
            if (currentPrice.compareTo(order.getPrice()) <= 0) {
                executeOrder(order, currentPrice, "현재가가 주문가격보다 유리하여 체결");
            }
        }
    }

    /**
     * 매도 주문 체결 처리
     * 현재가가 주문가격보다 높거나 같으면 체결
     */
    private void processSellOrders(String stockCode, BigDecimal currentPrice) {
        // PENDING 상태의 매도 주문들을 가격 오름차순으로 조회
        List<Order> pendingSellOrders = orderRepository
            .findByStockSymbolAndOrderTypeAndStatusOrderByPriceAsc(stockCode);

        for (Order order : pendingSellOrders) {
            // 현재가가 주문가격보다 높거나 같으면 체결
            if (currentPrice.compareTo(order.getPrice()) >= 0) {
                executeOrder(order, currentPrice, "현재가가 주문가격보다 유리하여 체결");
            }
        }
    }

    /**
     * 주문 체결 실행
     */
    private void executeOrder(Order order, BigDecimal executionPrice, String reason) {
        try {
            // 1. 주문 체결 처리
            order.fill(order.getQuantity(), executionPrice);
            orderRepository.save(order);

            // 2. 포트폴리오 업데이트
            updatePortfolio(order, executionPrice);

            // 3. 체결 알림 전송
            sendExecutionNotification(order, executionPrice, reason);

            log.info("✅ 주문 체결 완료: orderId={}, stockCode={}, price={}, quantity={}, reason={}", 
                order.getId(), order.getStock().getSymbol(), executionPrice, order.getQuantity(), reason);

        } catch (Exception e) {
            log.error("❌ 주문 체결 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
        }
    }

    /**
     * 포트폴리오 업데이트
     */
    private void updatePortfolio(Order order, BigDecimal executionPrice) {
        try {
            String stockCode = order.getStock().getSymbol();
            UUID memberId = order.getMember().getId();
            Integer quantity = order.getQuantity();
            BigDecimal totalAmount = executionPrice.multiply(BigDecimal.valueOf(quantity));

            // 회원의 계좌 조회
            com.hanazoom.domain.portfolio.entity.Account account = portfolioService.getAccountByMemberId(memberId);
            
            // 기존 포트폴리오 주식 조회
            Optional<PortfolioStock> existingPortfolioStock = portfolioStockRepository
                .findByAccountIdAndStockSymbol(account.getId(), stockCode);

            if (order.getOrderType() == Order.OrderType.BUY) {
                // 매수: 주식 수량 증가, 현금 감소
                if (existingPortfolioStock.isPresent()) {
                    PortfolioStock portfolioStock = existingPortfolioStock.get();
                    portfolioStock.buy(quantity, executionPrice);
                    portfolioStockRepository.save(portfolioStock);
                } else {
                    // 새로운 포트폴리오 주식 생성
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
                
                // 현금 차감 (실제로는 계좌 서비스와 연동 필요)
                log.info("💰 매수 체결: {}주 × {}원 = {}원 차감", quantity, executionPrice, totalAmount);
                
            } else {
                // 매도: 주식 수량 감소, 현금 증가
                if (existingPortfolioStock.isPresent()) {
                    PortfolioStock portfolioStock = existingPortfolioStock.get();
                    if (portfolioStock.hasQuantity(quantity)) {
                        portfolioStock.sell(quantity);
                        portfolioStockRepository.save(portfolioStock);
                        
                        // 보유 수량이 0이 되면 삭제
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
                
                // 현금 증가 (실제로는 계좌 서비스와 연동 필요)
                log.info("💰 매도 체결: {}주 × {}원 = {}원 증가", quantity, executionPrice, totalAmount);
            }

        } catch (Exception e) {
            log.error("❌ 포트폴리오 업데이트 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
        }
    }

    /**
     * 체결 알림 전송
     */
    private void sendExecutionNotification(Order order, BigDecimal executionPrice, String reason) {
        try {
            // 웹소켓으로 체결 알림 전송
            String notification = String.format(
                "주문이 체결되었습니다. 종목: %s, %s %d주, 체결가: %s원, 사유: %s",
                order.getStock().getName(),
                order.getOrderType() == Order.OrderType.BUY ? "매수" : "매도",
                order.getQuantity(),
                executionPrice.toPlainString(),
                reason
            );

            // TODO: 특정 사용자에게 알림 전송 (실제로는 사용자별 세션 관리 필요)
            // 이벤트 기반으로 변경하거나 별도 서비스로 분리 필요
            log.info("주문 체결 알림: 사용자={}, 주문={}, 알림={}", 
                order.getMember().getId(), order.getId(), notification);

        } catch (Exception e) {
            log.error("❌ 체결 알림 전송 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
        }
    }

    /**
     * 시장가 주문 즉시 체결 처리
     */
    public void executeMarketOrder(Order order, BigDecimal currentPrice) {
        if (order.getOrderMethod() == Order.OrderMethod.MARKET) {
            executeOrder(order, currentPrice, "시장가 주문 즉시 체결");
        }
    }
}
