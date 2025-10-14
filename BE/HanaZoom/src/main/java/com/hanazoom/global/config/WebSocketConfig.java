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
        @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001,https://*.trycloudflare.com,https://*.vercel.app}")
        private String allowedOrigins;

        @Override
        public void configureMessageBroker(MessageBrokerRegistry config) {
                // PB 방용 메시지 브로커 설정 (WebRTC + 채팅)
                config.enableSimpleBroker("/topic/pb-room", "/queue/pb-room");

                // 클라이언트가 메시지를 보낼 때 사용할 destination prefix
                config.setApplicationDestinationPrefixes("/app/webrtc", "/app/chat");

                // 특정 사용자에게 메시지를 보낼 때 사용할 prefix
                config.setUserDestinationPrefix("/user/pb-room");
        }

        @Override
        public void registerStompEndpoints(StompEndpointRegistry registry) {
                // 환경 변수에서 읽어온 origins를 배열로 변환
                String[] origins = allowedOrigins.split(",");

                // PB 방용 WebSocket 엔드포인트 (SockJS 포함)
                registry.addEndpoint("/ws/pb-room")
                                .setAllowedOriginPatterns(origins)
                                .withSockJS();

                // 일반 WebSocket 엔드포인트 (SockJS 없이)
                registry.addEndpoint("/ws/pb-room")
                                .setAllowedOriginPatterns(origins);
        }

        @Override
        public void configureClientInboundChannel(ChannelRegistration registration) {
                // WebSocket 인증 인터셉터 등록
                registration.interceptors(webSocketAuthInterceptor);
        }
}