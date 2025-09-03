package com.hanazoom.domain.order.controller;

import com.hanazoom.domain.order.dto.OrderRequest;
import com.hanazoom.domain.order.dto.OrderResponse;
import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.order.service.OrderService;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * 주문 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal Member member,
            @Valid @RequestBody OrderRequest request) {
        
        log.info("주문 생성 요청: memberId={}, stockCode={}, orderType={}, quantity={}", 
                member.getId(), request.getStockCode(), request.getOrderType(), request.getQuantity());

        OrderResponse response = orderService.createOrder(member, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 주문 조회
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal Member member,
            @PathVariable Long orderId) {
        
        OrderResponse response = orderService.getOrder(member, orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 주문 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrders(
            @AuthenticationPrincipal Member member,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<OrderResponse> orders = orderService.getOrders(member, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * 특정 종목 주문 목록 조회
     */
    @GetMapping("/stock/{stockSymbol}")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByStock(
            @AuthenticationPrincipal Member member,
            @PathVariable String stockSymbol,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<OrderResponse> orders = orderService.getOrdersByStock(member, stockSymbol, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * 미체결 주문 목록 조회
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getPendingOrders(
            @AuthenticationPrincipal Member member) {
        
        List<OrderResponse> orders = orderService.getPendingOrders(member);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * 주문 취소
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal Member member,
            @PathVariable Long orderId) {
        
        log.info("주문 취소 요청: memberId={}, orderId={}", member.getId(), orderId);
        
        OrderResponse response = orderService.cancelOrder(member, orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 주문 상태 조회
     */
    @GetMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<Order.OrderStatus>> getOrderStatus(
            @AuthenticationPrincipal Member member,
            @PathVariable Long orderId) {
        
        OrderResponse order = orderService.getOrder(member, orderId);
        return ResponseEntity.ok(ApiResponse.success(order.getStatus()));
    }
}






