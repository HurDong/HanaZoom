package com.hanazoom.global.config;

import com.hanazoom.global.handler.StockWebSocketHandler;
import com.hanazoom.global.handler.RegionChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final StockWebSocketHandler stockWebSocketHandler;
    private final RegionChatWebSocketHandler regionChatWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){
        registry.addHandler(stockWebSocketHandler, "/ws/stocks")
                .setAllowedOrigins("*");
        
        // 지역별 채팅 WebSocket 핸들러 추가
        registry.addHandler(regionChatWebSocketHandler, "/ws/chat/region")
                .setAllowedOrigins("*");
    }
}
