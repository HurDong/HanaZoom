package com.hanazoom.domain.order.event;

import com.hanazoom.domain.stock.dto.OrderBookItem;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.List;

@Getter
public class OrderMatchingEvent extends ApplicationEvent {
    private final String stockCode;
    private final String currentPrice;
    private final List<OrderBookItem> askOrders;
    private final List<OrderBookItem> bidOrders;

    public OrderMatchingEvent(Object source, String stockCode, String currentPrice, 
                            List<OrderBookItem> askOrders, List<OrderBookItem> bidOrders) {
        super(source);
        this.stockCode = stockCode;
        this.currentPrice = currentPrice;
        this.askOrders = askOrders;
        this.bidOrders = bidOrders;
    }
}

