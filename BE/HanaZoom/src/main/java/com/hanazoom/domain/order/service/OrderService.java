package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.dto.OrderRequest;
import com.hanazoom.domain.order.dto.OrderResponse;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {
    
    OrderResponse createOrder(Member member, OrderRequest request);
    
    OrderResponse getOrder(Member member, Long orderId);
    
    Page<OrderResponse> getOrders(Member member, Pageable pageable);
    
    Page<OrderResponse> getOrdersByStock(Member member, String stockSymbol, Pageable pageable);
    
    List<OrderResponse> getPendingOrders(Member member);
    
    OrderResponse cancelOrder(Member member, Long orderId);
}
