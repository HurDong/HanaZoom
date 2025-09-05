package com.hanazoom.global.config;

import com.hanazoom.global.interceptor.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트가 구독할 수 있는 destination prefix
        config.enableSimpleBroker("/topic", "/queue");
        
        // 클라이언트가 메시지를 보낼 때 사용할 destination prefix
        config.setApplicationDestinationPrefixes("/app");
        
        // 특정 사용자에게 메시지를 보낼 때 사용할 prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트 - 클라이언트별 구분
        registry.addEndpoint("/ws/consultation/{clientId}")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        
        // 일반 WebSocket 엔드포인트 (SockJS 없이) - 클라이언트별 구분
        registry.addEndpoint("/ws/consultation/{clientId}")
                .setAllowedOriginPatterns("*");
        
        // 기존 호환성을 위한 엔드포인트 (deprecated)
        registry.addEndpoint("/ws/consultation")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        
        registry.addEndpoint("/ws/consultation")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // WebSocket 인증 인터셉터 등록
        registration.interceptors(webSocketAuthInterceptor);
    }
}