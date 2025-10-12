package com.hanazoom.global.config;

import com.hanazoom.global.handler.RegionChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class RegionChatWebSocketConfig implements WebSocketConfigurer {

    private final RegionChatWebSocketHandler regionChatWebSocketHandler;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 지역 채팅용 WebSocket 핸들러 등록
        // 환경 변수에서 읽어온 origins를 배열로 변환
        String[] origins = allowedOrigins.split(",");
        registry.addHandler(regionChatWebSocketHandler, "/ws/chat/region")
                .setAllowedOriginPatterns(origins)
                .withSockJS() // SockJS 지원 추가 (안정성 향상)
                .setHeartbeatTime(25000); // 하트비트 시간 설정 (밀리초)
    }
}
