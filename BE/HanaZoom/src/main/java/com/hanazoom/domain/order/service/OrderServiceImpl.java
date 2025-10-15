package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.dto.OrderRequest;
import com.hanazoom.domain.order.dto.OrderResponse;
import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.order.repository.OrderRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import com.hanazoom.domain.stock.service.StockService;
import com.hanazoom.global.exception.BusinessException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;
    private final OrderMatchingService orderMatchingService;
    private final StockService stockService;

    @Override
    @Transactional
    public OrderResponse createOrder(Member member, OrderRequest request) {

        Stock stock = stockRepository.findBySymbol(request.getStockCode())
                .orElseThrow(() -> new BusinessException("STOCK_NOT_FOUND"));
        

        Order order = Order.builder()
                .member(member)
                .stock(stock)
                .orderType(request.getOrderType())
                .orderMethod(request.getOrderMethod())
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .totalAmount(request.getTotalAmount())
                .orderTime(LocalDateTime.now())
                .status(Order.OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        
        Order savedOrder = orderRepository.save(order);
        log.info("주문 생성 완료: orderId={}, memberId={}, stockCode={}", savedOrder.getId(), member.getId(), request.getStockCode());
        

        if (request.getOrderMethod() == Order.OrderMethod.MARKET) {
            try {

                String currentPrice = stockService.getRealTimePrice(request.getStockCode()).getCurrentPrice();
                orderMatchingService.executeMarketOrder(savedOrder, new BigDecimal(currentPrice));
            } catch (Exception e) {
                log.error("시장가 주문 즉시 체결 실패: orderId={}, error={}", savedOrder.getId(), e.getMessage());
            }
        }
        
        return OrderResponse.from(savedOrder);
    }

    @Override
    public OrderResponse getOrder(Member member, Long orderId) {
        Order order = orderRepository.findByIdAndMember(orderId, member)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND"));
        
        return OrderResponse.from(order);
    }

    @Override
    public Page<OrderResponse> getOrders(Member member, Pageable pageable) {
        Page<Order> orders = orderRepository.findByMemberOrderByCreatedAtDesc(member, pageable);
        return orders.map(OrderResponse::from);
    }

    @Override
    public Page<OrderResponse> getOrdersByStock(Member member, String stockSymbol, Pageable pageable) {
        Page<Order> orders = orderRepository.findByMemberAndStockSymbolOrderByCreatedAtDesc(member, stockSymbol, pageable);
        return orders.map(OrderResponse::from);
    }

    @Override
    public List<OrderResponse> getPendingOrders(Member member) {
        List<Order> pendingOrders = orderRepository.findByMemberAndStatusOrderByCreatedAtDesc(member, Order.OrderStatus.PENDING);
        return pendingOrders.stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Member member, Long orderId) {
        Order order = orderRepository.findByIdAndMember(orderId, member)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND"));
        
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BusinessException("ORDER_CANNOT_CANCEL");
        }
        
        order.updateStatus(Order.OrderStatus.CANCELLED);
        order.updateCancelledAt(LocalDateTime.now());
        
        Order savedOrder = orderRepository.save(order);
        log.info("주문 취소 완료: orderId={}, memberId={}", orderId, member.getId());
        
        return OrderResponse.from(savedOrder);
    }
}
