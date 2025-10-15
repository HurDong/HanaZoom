package com.hanazoom.domain.order.dto;

import com.hanazoom.domain.order.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String stockCode;
    private String stockName;
    private Order.OrderType orderType;
    private Order.OrderMethod orderMethod;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private Integer filledQuantity;
    private BigDecimal filledAmount;
    private BigDecimal averageFilledPrice;
    private LocalDateTime orderTime;
    private LocalDateTime filledTime;
    private LocalDateTime cancelTime;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    private Integer remainingQuantity;
    private Double fillRate;
    private String statusMessage;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .stockCode(order.getStock().getSymbol())
                .stockName(order.getStock().getName())
                .orderType(order.getOrderType())
                .orderMethod(order.getOrderMethod())
                .price(order.getPrice())
                .quantity(order.getQuantity())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .filledQuantity(order.getFilledQuantity())
                .filledAmount(order.getFilledAmount())
                .averageFilledPrice(order.getAverageFilledPrice())
                .orderTime(order.getOrderTime())
                .filledTime(order.getFilledTime())
                .cancelTime(order.getCancelTime())
                .rejectReason(order.getRejectReason())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .remainingQuantity(order.getRemainingQuantity())
                .fillRate(order.getFillRate())
                .statusMessage(getStatusMessage(order.getStatus()))
                .build();
    }

    private static String getStatusMessage(Order.OrderStatus status) {
        switch (status) {
            case PENDING:
                return "주문 접수";
            case PARTIAL_FILLED:
                return "부분 체결";
            case FILLED:
                return "전량 체결";
            case CANCELLED:
                return "주문 취소";
            case REJECTED:
                return "주문 거부";
            default:
                return "알 수 없음";
        }
    }
}



