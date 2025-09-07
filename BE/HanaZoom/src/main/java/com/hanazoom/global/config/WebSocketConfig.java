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
                // PB 방용 메시지 브로커 설정 (단순화)
                config.enableSimpleBroker("/topic/pb-room", "/queue/pb-room");

                // 클라이언트가 메시지를 보낼 때 사용할 destination prefix
                config.setApplicationDestinationPrefixes("/app/webrtc");

                // 특정 사용자에게 메시지를 보낼 때 사용할 prefix
                config.setUserDestinationPrefix("/user/pb-room");
        }

        @Override
        public void registerStompEndpoints(StompEndpointRegistry registry) {
                // PB 방용 WebSocket 엔드포인트 (단순화)
                registry.addEndpoint("/ws/pb-room")
                                .setAllowedOriginPatterns("*")
                                .withSockJS();

                // 일반 WebSocket 엔드포인트 (SockJS 없이)
                registry.addEndpoint("/ws/pb-room")
                                .setAllowedOriginPatterns("*");
        }

        @Override
        public void configureClientInboundChannel(ChannelRegistration registration) {
                // WebSocket 인증 인터셉터 등록
                registration.interceptors(webSocketAuthInterceptor);
        }
}