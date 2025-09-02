package com.hanazoom.global.filter;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.global.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        
        // WebSocket 연결 요청은 로그 출력하지 않음
        boolean isWebSocketRequest = requestURI.startsWith("/ws/") || requestURI.startsWith("/api/v1/websocket/");
        
        if (!isWebSocketRequest) {
            System.out.println("🔍 JWT 필터 요청: " + request.getMethod() + " " + requestURI);
        }
        
        String token = extractToken(request);

        if (token != null) {
            try {
                if (jwtUtil.validateToken(token)) {
                    UUID memberId = jwtUtil.getMemberIdFromToken(token);
                    Member member = jwtUtil.getMemberFromToken(token);

                    if (member != null) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(member,
                                null, member.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        if (!isWebSocketRequest) {
                            System.out.println("✅ JWT 인증 성공: " + memberId);
                        }
                    } else {
                        if (!isWebSocketRequest) {
                            System.out.println("⚠️ JWT 토큰에서 회원 정보를 찾을 수 없음: " + memberId);
                        }
                    }
                } else {
                    if (!isWebSocketRequest) {
                        System.out.println("⚠️ JWT 토큰 검증 실패: " + requestURI);
                    }
                }
            } catch (Exception e) {
                if (!isWebSocketRequest) {
                    System.out.println("❌ JWT 토큰 처리 중 오류 발생: " + e.getMessage());
                }
            }
        } else {
            if (!isWebSocketRequest) {
                System.out.println("ℹ️ JWT 토큰 없음: " + requestURI);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}