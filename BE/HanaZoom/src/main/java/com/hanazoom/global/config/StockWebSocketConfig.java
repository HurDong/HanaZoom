package com.hanazoom.global.config;

import com.hanazoom.global.handler.StockWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class StockWebSocketConfig implements WebSocketConfigurer {

    private final StockWebSocketHandler stockWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 주식 웹소켓 핸들러 등록 (상담과 완전 분리)
        // 상담용 WebSocket: /ws/consultation/{clientId} (STOMP 사용)
        // 주식용 WebSocket: /ws/stocks (일반 WebSocket 사용)
        registry.addHandler(stockWebSocketHandler, "/ws/stocks")
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001");
    }
}
