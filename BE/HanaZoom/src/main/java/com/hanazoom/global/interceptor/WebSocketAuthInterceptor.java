package com.hanazoom.global.interceptor;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 모든 헤더 로깅
            log.info("WebSocket CONNECT 헤더들: {}", accessor.toNativeHeaderMap());
            
            // 클라이언트 ID 추출 (URL에서)
            String clientId = extractClientIdFromDestination(accessor);
            log.info("추출된 클라이언트 ID: {}", clientId);
            
            String token = null;
            
            // 1. Authorization 헤더에서 토큰 확인
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);
                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                    log.info("Authorization 헤더에서 토큰 발견");
                }
            }
            
            // 2. 쿼리 파라미터에서 토큰 확인 (SockJS 헤더 문제 대안)
            if (token == null) {
                List<String> tokenParams = accessor.getNativeHeader("token");
                if (tokenParams != null && !tokenParams.isEmpty()) {
                    token = tokenParams.get(0);
                    log.info("쿼리 파라미터에서 토큰 발견");
                }
            }
            
            if (token != null) {
                try {
                    // JWT 토큰 검증
                    if (jwtUtil.validateToken(token)) {
                        UUID memberId = jwtUtil.getMemberIdFromToken(token);
                        
                        // 사용자 정보 조회
                        Member member = memberRepository.findById(memberId).orElse(null);
                        
                        if (member != null) {
                            // 인증 정보 설정
                            UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(member, null, member.getAuthorities());
                            
                            // SecurityContext를 명시적으로 설정하고 전파
                            SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            
                            // WebSocket 세션에 사용자 정보 저장
                            accessor.setUser(authentication);
                            
                            // 세션 속성에도 사용자 정보 저장 (다른 스레드에서 접근 가능)
                            accessor.getSessionAttributes().put("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
                            accessor.getSessionAttributes().put("USER_ID", memberId.toString());
                            accessor.getSessionAttributes().put("USER_EMAIL", member.getEmail());
                            accessor.getSessionAttributes().put("CLIENT_ID", clientId);
                            
                            log.info("WebSocket 인증 성공: {} (ID: {})", member.getEmail(), memberId);
                        } else {
                            log.warn("WebSocket 인증 실패: 사용자 정보를 찾을 수 없음 (ID: {})", memberId);
                        }
                    } else {
                        log.warn("WebSocket 인증 실패: 유효하지 않은 JWT 토큰");
                    }
                } catch (Exception e) {
                    log.error("WebSocket 인증 처리 중 오류: {}", e.getMessage());
                }
            } else {
                log.warn("WebSocket 인증 실패: 토큰을 찾을 수 없음 (헤더 또는 쿼리 파라미터)");
            }
        }
        
        return message;
    }
    
    private String extractClientIdFromDestination(StompHeaderAccessor accessor) {
        // destination 헤더에서 클라이언트 ID 추출
        List<String> destinations = accessor.getNativeHeader("destination");
        if (destinations != null && !destinations.isEmpty()) {
            String destination = destinations.get(0);
            // /ws/consultation/{clientId} 형태에서 clientId 추출
            if (destination != null && destination.contains("/ws/consultation/")) {
                String[] parts = destination.split("/");
                if (parts.length >= 4) {
                    return parts[3]; // {clientId} 부분
                }
            }
        }
        
        // destination에서 추출할 수 없으면 기본값 반환
        return "default";
    }
}