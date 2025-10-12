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

        // WebSocket 요청은 필터를 건너뛰고 핸들러에서 직접 인증 처리
        if (requestURI.startsWith("/ws/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request);

        if (token != null) {
            try {
                if (jwtUtil.validateToken(token)) {
                    UUID memberId = jwtUtil.getMemberIdFromToken(token);
                    Member member = jwtUtil.getMemberFromToken(token);

                    if (member != null) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                member,
                                null, member.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        System.out.println("🔐 JWT 인증 성공 - URI: " + requestURI + ", Member ID: " + member.getId());
                    } else {
                        System.out.println("❌ JWT 토큰은 유효하지만 사용자 정보를 찾을 수 없음: " + memberId);
                    }
                } else {
                    System.out.println("❌ JWT 토큰이 유효하지 않음 - URI: " + requestURI);
                }
            } catch (Exception e) {
                System.out.println("❌ JWT 토큰 처리 중 오류 발생: " + e.getMessage() + " - URI: " + requestURI);
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