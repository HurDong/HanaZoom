package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.dto.LoginRequest;
import com.hanazoom.domain.member.dto.LoginResponse;
import com.hanazoom.domain.member.dto.SignupRequest;
import com.hanazoom.domain.member.dto.TokenRefreshRequest;
import com.hanazoom.domain.member.dto.TokenRefreshResponse;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.global.util.JwtUtil;
import com.hanazoom.global.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;
    private final PasswordUtil passwordUtil;
    private final TokenService tokenService;

    @Override
    @Transactional
    public void signup(SignupRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordUtil.encodePassword(request.getPassword());

        Member member = new Member(
                request.getEmail(),
                encodedPassword,
                request.getName(),
                request.getPhone(),
                request.isTermsAgreed(),
                request.isPrivacyAgreed(),
                request.isMarketingAgreed(),
                request.getRegionId());

        memberRepository.save(member);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordUtil.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        member.updateLastLogin();

        // JWT 토큰 생성
        String accessToken = jwtUtil.generateAccessToken(member.getId(), member.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(member.getId(), member.getEmail());

        // Redis에 토큰 저장
        tokenService.saveAccessToken(member.getId(), accessToken);
        tokenService.saveRefreshToken(member.getId(), refreshToken);

        return new LoginResponse(member.getId(), member.getEmail(), member.getName(), accessToken, refreshToken);
    }

    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        // Refresh Token에서 사용자 정보 추출
        UUID memberId = jwtUtil.getMemberIdFromToken(request.getRefreshToken());
        String email = jwtUtil.getEmailFromToken(request.getRefreshToken());

        // Refresh Token 유효성 검증
        if (!tokenService.isValidRefreshToken(memberId, request.getRefreshToken())) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다.");
        }

        // 새로운 토큰 생성
        String newAccessToken = jwtUtil.generateAccessToken(memberId, email);
        String newRefreshToken = jwtUtil.generateRefreshToken(memberId, email);

        // Redis에 새로운 토큰 저장
        tokenService.saveAccessToken(memberId, newAccessToken);
        tokenService.saveRefreshToken(memberId, newRefreshToken);

        return new TokenRefreshResponse(newAccessToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(UUID memberId) {
        // Redis에서 모든 토큰 삭제
        tokenService.removeAllTokens(memberId);
    }
}