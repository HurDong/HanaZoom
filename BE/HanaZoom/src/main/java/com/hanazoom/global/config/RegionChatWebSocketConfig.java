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

        registry.addHandler(regionChatWebSocketHandler, "/ws/chat/region")
                .setAllowedOriginPatterns("*"); 
    }
}
