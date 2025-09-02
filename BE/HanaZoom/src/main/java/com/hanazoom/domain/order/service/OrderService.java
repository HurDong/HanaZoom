package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.dto.OrderRequest;
import com.hanazoom.domain.order.dto.OrderResponse;
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
     * 주문 목록 조회
     */
    Page<OrderResponse> getOrders(Member member, Pageable pageable);
    
    /**
     * 특정 종목 주문 목록 조회
     */
    Page<OrderResponse> getOrdersByStock(Member member, String stockSymbol, Pageable pageable);
    
    /**
     * 미체결 주문 목록 조회
     */
    List<OrderResponse> getPendingOrders(Member member);
    
    /**
     * 주문 취소
     */
    OrderResponse cancelOrder(Member member, Long orderId);
}
