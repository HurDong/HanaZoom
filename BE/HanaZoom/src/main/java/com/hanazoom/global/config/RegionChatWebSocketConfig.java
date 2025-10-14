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
        // 지역 채팅용 WebSocket 핸들러 등록 (일반 WebSocket 사용)
        registry.addHandler(regionChatWebSocketHandler, "/ws/chat/region")
                .setAllowedOriginPatterns("*"); // 개발 환경에서는 모든 오리진 허용
    }
}
