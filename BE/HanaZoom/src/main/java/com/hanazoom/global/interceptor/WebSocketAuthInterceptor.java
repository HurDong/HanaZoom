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
import java.util.Map;
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

        if (accessor != null) {
            log.info("WebSocket 메시지 수신: command={}, destination={}",
                    accessor.getCommand(), accessor.getDestination());

            if (StompCommand.CONNECT.equals(accessor.getCommand())) {

                log.info("WebSocket CONNECT 헤더들: {}", accessor.toNativeHeaderMap());


                String clientId = extractClientIdFromDestination(accessor);
                log.info("추출된 클라이언트 ID: {}", clientId);

                String token = null;


                List<String> authHeaders = accessor.getNativeHeader("Authorization");
                if (authHeaders != null && !authHeaders.isEmpty()) {
                    String authHeader = authHeaders.get(0);
                    if (authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                        log.info("Authorization 헤더에서 토큰 발견");
                    }
                }


                if (token == null) {
                    List<String> tokenHeaders = accessor.getNativeHeader("token");
                    if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
                        token = tokenHeaders.get(0);
                        log.info("커스텀 헤더에서 토큰 발견");
                    }
                }


                List<String> clientIdHeaders = accessor.getNativeHeader("CLIENT_ID");
                if (clientIdHeaders != null && !clientIdHeaders.isEmpty()) {
                    clientId = clientIdHeaders.get(0);
                    log.info("CLIENT_ID 헤더에서 클라이언트 ID 발견: {}", clientId);
                }

                if (token != null) {
                    try {

                        if (jwtUtil.validateToken(token)) {
                            UUID memberId = jwtUtil.getMemberIdFromToken(token);


                            Member member = memberRepository.findById(memberId).orElse(null);

                            if (member != null) {

                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                        member, null, member.getAuthorities());


                                SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
                                SecurityContextHolder.getContext().setAuthentication(authentication);


                                accessor.setUser(authentication);


                                accessor.getSessionAttributes().put("SPRING_SECURITY_CONTEXT",
                                        SecurityContextHolder.getContext());
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
            } else if (StompCommand.SEND.equals(accessor.getCommand())) {

                log.info("SEND 명령 수신: destination={}", accessor.getDestination());


                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                if (sessionAttributes != null) {
                    String userId = (String) sessionAttributes.get("USER_ID");
                    if (userId != null) {
                        try {
                            UUID memberId = UUID.fromString(userId);
                            Member member = memberRepository.findById(memberId).orElse(null);

                            if (member != null) {

                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                        member, null, member.getAuthorities());
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                accessor.setUser(authentication);

                                log.info("SEND 명령 시 인증 컨텍스트 복원: {} (ID: {})", member.getEmail(), memberId);
                            }
                        } catch (Exception e) {
                            log.error("SEND 명령 시 인증 컨텍스트 복원 실패: {}", e.getMessage());
                        }
                    }
                }
            }
        }

        return message;
    }

    private String extractClientIdFromDestination(StompHeaderAccessor accessor) {

        if (accessor != null) {
            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String clientId = (String) sessionAttributes.get("CLIENT_ID");
                if (clientId != null) {
                    return clientId;
                }
            }
        }


        return "default";
    }
}