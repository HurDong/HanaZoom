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

                config.enableSimpleBroker("/topic/pb-room", "/queue/pb-room");


                config.setApplicationDestinationPrefixes("/app/webrtc", "/app/chat");


                config.setUserDestinationPrefix("/user/pb-room");
        }

        @Override
        public void registerStompEndpoints(StompEndpointRegistry registry) {

                registry.addEndpoint("/ws/pb-room")
                                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001")
                                .withSockJS();


                registry.addEndpoint("/ws/pb-room")
                                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001");
        }

        @Override
        public void configureClientInboundChannel(ChannelRegistration registration) {

                registration.interceptors(webSocketAuthInterceptor);
        }
}