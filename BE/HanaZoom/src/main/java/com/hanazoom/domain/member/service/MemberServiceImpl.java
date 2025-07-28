package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.global.dto.KakaoAddressResponse;
import com.hanazoom.global.service.KakaoApiService;
import com.hanazoom.global.util.JwtUtil;
import com.hanazoom.global.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region.entity.Region;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final PasswordUtil passwordUtil;
    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final KakaoApiService kakaoApiService;
    private final RegionRepository regionRepository;

    @Override
    @Transactional
    public void signup(SignupRequest request) {
        // 이메일 중복 체크
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordUtil.encodePassword(request.getPassword());

        // 주소가 있는 경우 좌표 변환 및 지역 매칭
        Double latitude = request.getLatitude();
        Double longitude = request.getLongitude();
        Long regionId = null;

        if (request.getAddress() != null) {
            // 주소로부터 region_id 찾기
            regionId = kakaoApiService.getRegionIdFromAddress(request.getAddress());

            // 좌표가 없는 경우에만 좌표 변환
            if (latitude == null || longitude == null) {
                KakaoAddressResponse.Document coordinates = kakaoApiService.getCoordinates(request.getAddress());
                if (coordinates != null) {
                    latitude = coordinates.getLatitude();
                    longitude = coordinates.getLongitude();
                }
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
                .regionId(regionId)
                .termsAgreed(request.isTermsAgreed())
                .privacyAgreed(request.isPrivacyAgreed())
                .marketingAgreed(request.isMarketingAgreed())
                .build();

        memberRepository.save(member);

        log.info("회원가입 완료 - 이메일: {}, 지역ID: {}", request.getEmail(), regionId);
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
    public Long getUserRegionId(String userEmail) {
        log.info("getUserRegionId 호출 - 이메일: {}", userEmail);

        Member member = memberRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        log.info("사용자 {}의 저장된 regionId: {}", userEmail, member.getRegionId());

        // 1. 저장된 regionId가 있으면 바로 반환
        if (member.getRegionId() != null) {
            log.info("저장된 regionId 반환: {}", member.getRegionId());
            return member.getRegionId();
        }

        // 2. regionId가 없고 좌표가 있으면 좌표로 지역 찾기
        if (member.getLatitude() != null && member.getLongitude() != null) {
            log.info("좌표로 지역 찾기 시도: lat={}, lng={}", member.getLatitude(), member.getLongitude());
            Long regionId = regionRepository.findNearestNeighborhood(
                    member.getLatitude(),
                    member.getLongitude()).map(Region::getId).orElse(null);

            // 찾은 regionId를 저장
            if (regionId != null) {
                member.updateRegion(regionId);
                memberRepository.save(member);
                log.info("사용자 {}의 지역ID {} 자동 설정됨", userEmail, regionId);
            }

            return regionId;
        }

        // 3. 주소가 있으면 주소로 지역 찾기
        if (member.getAddress() != null) {
            log.info("주소로 지역 찾기 시도: {}", member.getAddress());
            Long regionId = kakaoApiService.getRegionIdFromAddress(member.getAddress());

            if (regionId != null) {
                member.updateRegion(regionId);
                memberRepository.save(member);
                log.info("사용자 {}의 지역ID {} 주소로 설정됨", userEmail, regionId);
            }

            return regionId;
        }

        log.warn("사용자 {}의 지역 정보를 찾을 수 없음 - regionId={}, 좌표={},{}, 주소={}",
                userEmail, member.getRegionId(), member.getLatitude(), member.getLongitude(), member.getAddress());
        return null;
    }
}
