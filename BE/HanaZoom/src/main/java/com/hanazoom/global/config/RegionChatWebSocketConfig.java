package com.hanazoom.global.config;

import com.hanazoom.global.handler.RegionChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class RegionChatWebSocketConfig implements WebSocketConfigurer {

    private final RegionChatWebSocketHandler regionChatWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 지역 채팅용 WebSocket 핸들러 등록
        registry.addHandler(regionChatWebSocketHandler, "/ws/chat/region")
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001", "http://localhost:8080")
                .withSockJS(); // SockJS 지원 추가 (안정성 향상)
    }
}
