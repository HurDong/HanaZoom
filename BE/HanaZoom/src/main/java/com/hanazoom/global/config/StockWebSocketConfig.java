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



        registry.addHandler(stockWebSocketHandler, "/ws/stocks")
        .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001");
    }
}
