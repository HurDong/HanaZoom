package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.dto.OrderRequest;
import com.hanazoom.domain.order.dto.OrderResponse;
import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.order.repository.OrderRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.stock.entity.Stock;
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
    private final StockService stockService;

    @Override
    @Transactional
    public OrderResponse createOrder(Member member, OrderRequest request) {
        log.info("주문 생성 요청: memberId={}, stockCode={}, orderType={}, quantity={}", 
                member.getId(), request.getStockCode(), request.getOrderType(), request.getQuantity());

        // 주문 유효성 검사
        validateOrder(member, request);

        // 종목 정보 조회
        Stock stock = stockService.getStockBySymbol(request.getStockCode());

        // 시장가 주문인 경우 현재가로 설정
        BigDecimal orderPrice = request.getPrice();
        if (request.getOrderMethod() == Order.OrderMethod.MARKET) {
            // TODO: 실시간 현재가 조회 로직 구현
            // 임시로 요청된 가격 사용 (실제로는 KIS API에서 현재가 조회)
            orderPrice = request.getPrice();
        }

        // 주문 생성
        Order order = Order.builder()
                .member(member)
                .stock(stock)
                .orderType(request.getOrderType())
                .orderMethod(request.getOrderMethod())
                .price(orderPrice)
                .quantity(request.getQuantity())
                .totalAmount(request.getTotalAmount())
                .status(Order.OrderStatus.PENDING)
                .orderTime(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);
        log.info("주문 생성 완료: orderId={}", savedOrder.getId());

        return OrderResponse.from(savedOrder);
    }

    @Override
    public OrderResponse getOrder(Member member, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND"));

        // 본인의 주문만 조회 가능
        if (!order.getMember().getId().equals(member.getId())) {
            throw new BusinessException("ACCESS_DENIED");
        }

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
        List<Order> orders = orderRepository.findPendingOrdersByMember(member);
        return orders.stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Member member, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND"));

        // 본인의 주문만 취소 가능
        if (!order.getMember().getId().equals(member.getId())) {
            throw new BusinessException("ACCESS_DENIED");
        }

        // 미체결 주문만 취소 가능
        if (order.getStatus() != Order.OrderStatus.PENDING && 
            order.getStatus() != Order.OrderStatus.PARTIAL_FILLED) {
            throw new BusinessException("ORDER_CANNOT_CANCEL");
        }

        order.cancel();
        Order savedOrder = orderRepository.save(order);
        log.info("주문 취소 완료: orderId={}", orderId);

        return OrderResponse.from(savedOrder);
    }

    @Override
    @Transactional
    public void updateOrderStatus(Long orderId, Order.OrderStatus status, Integer filledQuantity, Double filledPrice) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND"));

        if (filledQuantity != null && filledPrice != null) {
            order.fill(filledQuantity, BigDecimal.valueOf(filledPrice));
        } else {
            switch (status) {
                case CANCELLED:
                    order.cancel();
                    break;
                case REJECTED:
                    order.reject("시스템 오류");
                    break;
                default:
                    // 상태만 업데이트
                    order.setStatus(status);
            }
        }

        orderRepository.save(order);
        log.info("주문 상태 업데이트: orderId={}, status={}", orderId, status);
    }

    @Override
    public void validateOrder(Member member, OrderRequest request) {
        // 기본 유효성 검사
        if (request.getQuantity() <= 0) {
            throw new BusinessException("INVALID_ORDER_QUANTITY");
        }

        // 지정가 주문인 경우에만 가격 검증
        if (request.getOrderMethod() == Order.OrderMethod.LIMIT && 
            (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BusinessException("INVALID_ORDER_PRICE");
        }

        // 시장가 주문 검증 (현재는 검증하지 않음)
        request.validateMarketOrder();

        // 매수 주문인 경우 잔고 확인
        if (request.getOrderType() == Order.OrderType.BUY) {
            if (!checkBalance(member, request)) {
                throw new BusinessException("INSUFFICIENT_BALANCE");
            }
        }

        // 매도 주문인 경우 보유 주식 확인
        if (request.getOrderType() == Order.OrderType.SELL) {
            if (!checkStockHolding(member, request.getStockCode(), request.getQuantity())) {
                throw new BusinessException("INSUFFICIENT_STOCK");
            }
        }
    }

    @Override
    public boolean checkBalance(Member member, OrderRequest request) {
        // TODO: 실제 계좌 잔고 조회 로직 구현
        // 임시로 항상 true 반환 (실제로는 KIS API에서 잔고 조회)
        BigDecimal requiredAmount = request.getTotalAmount();
        
        // 임시 잔고: 1,000만원
        BigDecimal availableBalance = BigDecimal.valueOf(10_000_000);
        
        return availableBalance.compareTo(requiredAmount) >= 0;
    }

    @Override
    public boolean checkStockHolding(Member member, String stockSymbol, Integer quantity) {
        // TODO: 실제 보유 주식 조회 로직 구현
        // 임시로 항상 true 반환 (실제로는 KIS API에서 보유 주식 조회)
        
        // 임시 보유 수량: 1000주
        int availableQuantity = 1000;
        
        return availableQuantity >= quantity;
    }
}
