package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.global.dto.KakaoAddressResponse;
import com.hanazoom.global.service.KakaoApiService;
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
    private final PasswordUtil passwordUtil;
    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final KakaoApiService kakaoApiService;

    @Override
    @Transactional
    public void signup(SignupRequest request) {
        // 이메일 중복 체크
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordUtil.encodePassword(request.getPassword());

        // 주소가 있는 경우 좌표 변환
        Double latitude = request.getLatitude();
        Double longitude = request.getLongitude();

        if (request.getAddress() != null && (latitude == null || longitude == null)) {
            KakaoAddressResponse.Document coordinates = kakaoApiService.getCoordinates(request.getAddress());
            if (coordinates != null) {
                latitude = coordinates.getLatitude();
                longitude = coordinates.getLongitude();
            }
        }

        // 회원 생성
        Member member = Member.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .detailAddress(request.getDetailAddress())
                .zonecode(request.getZonecode())
                .latitude(latitude)
                .longitude(longitude)
                .termsAgreed(request.isTermsAgreed())
                .privacyAgreed(request.isPrivacyAgreed())
                .marketingAgreed(request.isMarketingAgreed())
                .build();

        memberRepository.save(member);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 회원 조회
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

        // 비밀번호 검증
        if (!passwordUtil.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 마지막 로그인 시간 업데이트
        member.updateLastLogin();

        // 토큰 생성
        String accessToken = jwtUtil.generateAccessToken(member.getId(), member.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(member.getId(), member.getEmail());

        // 리프레시 토큰 저장
        tokenService.saveRefreshToken(member.getId(), refreshToken);

        return new LoginResponse(member.getId(), member.getEmail(), member.getName(),
                member.getAddress(), member.getLatitude(), member.getLongitude(),
                accessToken, refreshToken);
    }

    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        // 리프레시 토큰 검증
        if (!jwtUtil.validateToken(request.getRefreshToken())) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 토큰에서 정보 추출
        UUID memberId = jwtUtil.getMemberIdFromToken(request.getRefreshToken());
        String email = jwtUtil.getEmailFromToken(request.getRefreshToken());

        // 저장된 리프레시 토큰 검증
        if (!tokenService.validateRefreshToken(memberId, request.getRefreshToken())) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 새로운 토큰 생성
        String newAccessToken = jwtUtil.generateAccessToken(memberId, email);
        String newRefreshToken = jwtUtil.generateRefreshToken(memberId, email);

        // 리프레시 토큰 업데이트
        tokenService.saveRefreshToken(memberId, newRefreshToken);

        return new TokenRefreshResponse(newAccessToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(UUID memberId) {
        // 리프레시 토큰 삭제
        tokenService.removeAllTokens(memberId);
    }
}