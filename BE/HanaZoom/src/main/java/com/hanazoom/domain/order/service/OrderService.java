package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.dto.OrderRequest;
import com.hanazoom.domain.order.dto.OrderResponse;
import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {

    /**
     * 주문 생성
     */
    OrderResponse createOrder(Member member, OrderRequest request);

    /**
     * 주문 조회
     */
    OrderResponse getOrder(Member member, Long orderId);

    /**
     * 사용자의 주문 목록 조회
     */
    Page<OrderResponse> getOrders(Member member, Pageable pageable);

    /**
     * 사용자의 특정 종목 주문 목록 조회
     */
    Page<OrderResponse> getOrdersByStock(Member member, String stockSymbol, Pageable pageable);

    /**
     * 사용자의 미체결 주문 목록 조회
     */
    List<OrderResponse> getPendingOrders(Member member);

    /**
     * 주문 취소
     */
    OrderResponse cancelOrder(Member member, Long orderId);

    /**
     * 주문 상태 업데이트 (체결 처리)
     */
    void updateOrderStatus(Long orderId, Order.OrderStatus status, Integer filledQuantity, Double filledPrice);

    /**
     * 주문 유효성 검사
     */
    void validateOrder(Member member, OrderRequest request);

    /**
     * 계좌 잔고 확인
     */
    boolean checkBalance(Member member, OrderRequest request);

    /**
     * 보유 주식 확인 (매도 주문 시)
     */
    boolean checkStockHolding(Member member, String stockSymbol, Integer quantity);
}

