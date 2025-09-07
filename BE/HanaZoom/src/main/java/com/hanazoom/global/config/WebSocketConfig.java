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
                // 상담용 메시지 브로커만 활성화 (주식과 완전 분리)
                config.enableSimpleBroker("/topic/consultation", "/queue/consultation");

                // 클라이언트가 메시지를 보낼 때 사용할 destination prefix
                config.setApplicationDestinationPrefixes("/app/consultation");

                // 특정 사용자에게 메시지를 보낼 때 사용할 prefix
                config.setUserDestinationPrefix("/user/consultation");

                // 주식 관련 메시지 브로커는 비활성화 (완전 분리)
                // 주식은 별도의 WebSocket 핸들러 사용
        }

        @Override
        public void registerStompEndpoints(StompEndpointRegistry registry) {
                // 상담용 WebSocket 엔드포인트 (SockJS 경로 문제 해결)
                registry.addEndpoint("/ws/consultation")
                                .setAllowedOriginPatterns("*")
                                .withSockJS();

                // 일반 WebSocket 엔드포인트 (SockJS 없이)
                registry.addEndpoint("/ws/consultation")
                                .setAllowedOriginPatterns("*");
        }

        @Override
        public void configureClientInboundChannel(ChannelRegistration registration) {
                // WebSocket 인증 인터셉터 등록
                registration.interceptors(webSocketAuthInterceptor);
        }
}