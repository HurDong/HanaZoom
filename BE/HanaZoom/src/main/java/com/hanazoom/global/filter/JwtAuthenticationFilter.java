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

        // 모든 요청에 대한 로깅 추가
        System.out.println("🔍 JWT 필터 요청: " + request.getMethod() + " " + request.getRequestURI());
        
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
                        System.out.println("✅ JWT 인증 성공: " + memberId);
                    } else {
                        System.out.println("⚠️ JWT 토큰에서 회원 정보를 찾을 수 없음: " + memberId);
                    }
                } else {
                    System.out.println("⚠️ JWT 토큰 검증 실패: " + request.getRequestURI());
                }
            } catch (Exception e) {
                System.out.println("❌ JWT 토큰 처리 중 오류 발생: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️ JWT 토큰 없음: " + request.getRequestURI());
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