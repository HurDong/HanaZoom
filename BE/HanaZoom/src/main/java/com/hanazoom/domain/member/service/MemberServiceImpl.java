package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.*;
import com.hanazoom.domain.member.entity.LoginType;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.entity.PbStatus;
import com.hanazoom.domain.member.entity.SocialAccount;
import com.hanazoom.domain.member.entity.SocialProvider;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.member.repository.SocialAccountRepository;
import com.hanazoom.global.dto.KakaoAddressResponse;
import com.hanazoom.global.service.KakaoApiService;
import com.hanazoom.global.service.KakaoOAuthService;
import com.hanazoom.global.util.JwtUtil;
import com.hanazoom.global.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.portfolio.service.AutoAccountCreationService;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final PasswordUtil passwordUtil;
    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final KakaoApiService kakaoApiService;
    private final KakaoOAuthService kakaoOAuthService;
    private final RegionRepository regionRepository;
    private final AutoAccountCreationService autoAccountCreationService;

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

        // 개발 환경에서만 자동 계좌 생성
        try {
            autoAccountCreationService.createAccountForNewMember(member);
            log.info("자동 계좌 생성 완료 - 회원: {}", member.getEmail());
        } catch (Exception e) {
            log.warn("자동 계좌 생성 실패 - 회원: {}, 오류: {}", member.getEmail(), e.getMessage());
            // 계좌 생성 실패는 회원가입 실패로 처리하지 않음
        }

        log.info("회원가입 완료 - 이메일: {}, 지역ID: {}", request.getEmail(), regionId);
    }

    @Override
    @Transactional
    public LoginResponse kakaoLogin(KakaoLoginRequest request) {
        try {
            // 1. 카카오 액세스 토큰 획득
            var tokenResponse = kakaoOAuthService.getAccessToken(request.getCode());

            // 2. 카카오 사용자 정보 획득
            var userInfo = kakaoOAuthService.getUserInfo(tokenResponse.getAccessToken());

            // 3. 카카오 사용자 정보 검증
            if (userInfo.getProperties() == null || userInfo.getProperties().getNickname() == null) {
                log.error("카카오 사용자 정보에서 properties 또는 nickname을 찾을 수 없습니다. scope 설정을 확인해주세요.");
                throw new RuntimeException("카카오 사용자 정보를 가져올 수 없습니다. 필요한 권한이 부족합니다.");
            }

            // 4. 기존 소셜 계정이 있는지 확인
            var existingSocialAccount = socialAccountRepository
                    .findByProviderAndProviderUserId(SocialProvider.KAKAO, userInfo.getId().toString());

            if (existingSocialAccount.isPresent()) {
                // 기존 소셜 계정이 있는 경우
                var socialAccount = existingSocialAccount.get();
                var member = socialAccount.getMember();

                // 토큰 정보 업데이트
                socialAccount.updateTokens(
                        tokenResponse.getAccessToken(),
                        tokenResponse.getRefreshToken(),
                        java.time.LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
                socialAccount.updateLastLogin();
                member.updateLastLogin();

                // JWT 토큰 생성
                String accessToken = jwtUtil.generateAccessToken(member.getId(), member.getEmail());
                String refreshToken = jwtUtil.generateRefreshToken(member.getId(), member.getEmail());

                // 리프레시 토큰 저장
                tokenService.saveRefreshToken(member.getId(), refreshToken);

                // 기존 회원의 경우 저장된 위치 정보를 그대로 반환
                return LoginResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .id(member.getId())
                        .email(member.getEmail())
                        .name(member.getName())
                        .address(member.getAddress())
                        .latitude(member.getLatitude())
                        .longitude(member.getLongitude())
                        .isPb(member.isPb())
                        .pbStatus(member.getPbStatus() != null ? member.getPbStatus().name() : null)
                        .build();
            }

            // 5. 새로운 소셜 계정인 경우
            // 이메일이 있는지 확인 (profile_nickname scope만으로는 이메일을 가져올 수 없음)
            // 따라서 이메일 기반 연결은 현재 불가능
            // 기존 회원과의 연결 로직은 나중에 account_email scope 추가 시 구현

            // 6. 완전히 새로운 회원인 경우

            // 6. 완전히 새로운 회원인 경우
            // 위치 정보가 없는 경우 위치 설정 페이지로 리다이렉트
            var newMember = Member.builder()
                    .email("kakao_" + userInfo.getId() + "@kakao.com") // 이메일은 항상 생성
                    .password("") // 소셜 로그인은 비밀번호 없음
                    .name(userInfo.getProperties().getNickname())
                    .phone("") // 카카오에서 제공하지 않음
                    .loginType(LoginType.KAKAO)
                    .termsAgreed(true) // 카카오 로그인 시 약관 동의로 간주
                    .privacyAgreed(true)
                    .marketingAgreed(false)
                    .build();

            memberRepository.save(newMember);

            var socialAccount = SocialAccount.builder()
                    .provider(SocialProvider.KAKAO)
                    .providerUserId(userInfo.getId().toString())
                    .email("kakao_" + userInfo.getId() + "@kakao.com")
                    .name(userInfo.getProperties().getNickname())
                    .profileImageUrl(userInfo.getProperties().getProfileImage())
                    .accessToken(tokenResponse.getAccessToken())
                    .refreshToken(tokenResponse.getRefreshToken())
                    .tokenExpiresAt(java.time.LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()))
                    .member(newMember)
                    .build();

            socialAccountRepository.save(socialAccount);
            newMember.addSocialAccount(socialAccount);

            // JWT 토큰 생성
            String accessToken = jwtUtil.generateAccessToken(newMember.getId(), newMember.getEmail());
            String refreshToken = jwtUtil.generateRefreshToken(newMember.getId(), newMember.getEmail());

            // 리프레시 토큰 저장
            tokenService.saveRefreshToken(newMember.getId(), refreshToken);

            // 위치 정보가 없는 경우 위치 설정이 필요함을 표시
            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .id(newMember.getId())
                    .email(newMember.getEmail())
                    .name(newMember.getName())
                    .address(null) // 위치 정보 없음
                    .latitude(null)
                    .longitude(null)
                    .isPb(newMember.isPb())
                    .pbStatus(newMember.getPbStatus() != null ? newMember.getPbStatus().name() : null)
                    .build();

        } catch (Exception e) {
            log.error("카카오 로그인 실패: {}", e.getMessage());
            throw new RuntimeException("카카오 로그인에 실패했습니다.", e);
        }
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            log.info("🔄 로그인 요청 시작 - 이메일: {}", request.getEmail());

            // 회원 조회
            Member member = memberRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));
            log.info("✅ 회원 조회 완료 - ID: {}", member.getId());

            // 비밀번호 검증
            boolean passwordValid = passwordUtil.matches(request.getPassword(), member.getPassword());
            // TODO : 삭제 필요
            // BCrypt 해시로 검증 실패 시 평문으로도 시도 (Python 스크립트로 생성된 사용자들 대응)
            if (!passwordValid && !request.getPassword().equals(member.getPassword())) {
                log.error("❌ 비밀번호 검증 실패 - 이메일: {}", request.getEmail());
                throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
            }

            // 평문 비밀번호로 로그인한 경우, 비밀번호를 해싱해서 업데이트
            if (!passwordValid && request.getPassword().equals(member.getPassword())) {
                log.info("🔄 평문 비밀번호로 로그인 - 비밀번호 해싱 업데이트 필요: {}", request.getEmail());
                // 비밀번호를 해싱해서 업데이트
                member.updatePassword(passwordUtil.encodePassword(request.getPassword()));
                memberRepository.save(member);
            }
            log.info("✅ 비밀번호 검증 완료");

            // 마지막 로그인 시간 업데이트
            member.updateLastLogin();
            log.info("✅ 마지막 로그인 시간 업데이트 완료");

            // 토큰 생성
            String accessToken = jwtUtil.generateAccessToken(member.getId(), member.getEmail());
            String refreshToken = jwtUtil.generateRefreshToken(member.getId(), member.getEmail());
            log.info("✅ JWT 토큰 생성 완료");

            // 리프레시 토큰 저장
            tokenService.saveRefreshToken(member.getId(), refreshToken);
            log.info("✅ 리프레시 토큰 저장 완료");

            log.info("🎉 로그인 성공 - 이메일: {}, ID: {}", request.getEmail(), member.getId());
            return new LoginResponse(member.getId(), member.getEmail(), member.getName(),
                    member.getAddress(), member.getLatitude(), member.getLongitude(),
                    accessToken, refreshToken, member.isPb(),
                    member.getPbStatus() != null ? member.getPbStatus().name() : null);
        } catch (Exception e) {
            log.error("❌ 로그인 처리 중 오류 발생: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        try {
            log.info("🔄 토큰 갱신 요청 시작");

            // 리프레시 토큰 검증
            if (!jwtUtil.validateToken(request.getRefreshToken())) {
                log.error("❌ 리프레시 토큰 검증 실패");
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            // 토큰에서 정보 추출
            UUID memberId = jwtUtil.getMemberIdFromToken(request.getRefreshToken());
            String email = jwtUtil.getEmailFromToken(request.getRefreshToken());
            log.info("✅ 토큰에서 정보 추출 완료 - memberId: {}, email: {}", memberId, email);

            // 저장된 리프레시 토큰 검증
            if (!tokenService.validateRefreshToken(memberId, request.getRefreshToken())) {
                log.error("❌ 저장된 리프레시 토큰 검증 실패 - memberId: {}", memberId);
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            // 새로운 토큰 생성
            String newAccessToken = jwtUtil.generateAccessToken(memberId, email);
            String newRefreshToken = jwtUtil.generateRefreshToken(memberId, email);
            log.info("✅ 새로운 토큰 생성 완료");

            // 리프레시 토큰 업데이트
            tokenService.saveRefreshToken(memberId, newRefreshToken);
            log.info("✅ 리프레시 토큰 저장 완료");

            return new TokenRefreshResponse(newAccessToken, newRefreshToken);
        } catch (Exception e) {
            log.error("❌ 토큰 갱신 중 오류 발생: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public Long getUserRegionId(String userEmail) {
        Member member = memberRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 1. 저장된 regionId가 있으면 바로 반환
        if (member.getRegionId() != null) {
            return member.getRegionId();
        }

        // 2. regionId가 없고 좌표가 있으면 좌표로 지역 찾기
        if (member.getLatitude() != null && member.getLongitude() != null) {
            Long regionId = regionRepository.findNearestNeighborhood(
                    member.getLatitude(),
                    member.getLongitude()).map(Region::getId).orElse(null);

            // 찾은 regionId를 저장
            if (regionId != null) {
                member.updateRegion(regionId);
                memberRepository.save(member);
            }

            return regionId;
        }

        // 3. 주소가 있으면 주소로 지역 찾기
        if (member.getAddress() != null) {
            Long regionId = kakaoApiService.getRegionIdFromAddress(member.getAddress());

            if (regionId != null) {
                member.updateRegion(regionId);
                memberRepository.save(member);
            }

            return regionId;
        }

        return null;
    }

    @Override
    @Transactional
    public void sendPasswordResetCode(String email) {
        // TODO: 이메일 인증 코드 발송 로직 구현
        log.info("비밀번호 재설정 인증 코드 발송 요청 - 이메일: {}", email);
        throw new UnsupportedOperationException("비밀번호 재설정 기능은 아직 구현되지 않았습니다.");
    }

    @Override
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        // TODO: 비밀번호 재설정 로직 구현
        log.info("비밀번호 재설정 요청 - 이메일: {}, 코드: {}", email, code);
        throw new UnsupportedOperationException("비밀번호 재설정 기능은 아직 구현되지 않았습니다.");
    }

    @Override
    @Transactional
    public void updateLocation(String email, LocationUpdateRequest request) {
        // 회원 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 주소로부터 region_id 찾기
        Long regionId = null;
        if (request.getAddress() != null) {
            regionId = kakaoApiService.getRegionIdFromAddress(request.getAddress());
        }

        // 좌표 처리 로직 개선
        Double latitude = request.getLatitude();
        Double longitude = request.getLongitude();

        // 좌표가 없거나 0인 경우에만 좌표 변환 시도
        if (latitude == null || longitude == null || latitude == 0 || longitude == 0) {
            // 첫 번째 시도: 정확한 주소로 좌표 변환
            try {
                KakaoAddressResponse.Document coordinates = kakaoApiService.getCoordinates(request.getAddress());
                if (coordinates != null && coordinates.getLatitude() != null && coordinates.getLongitude() != null) {
                    latitude = coordinates.getLatitude();
                    longitude = coordinates.getLongitude();
                } else {
                    // 두 번째 시도: 주소에서 시/구/동만 추출하여 좌표 변환
                    String simplifiedAddress = extractSimplifiedAddress(request.getAddress());
                    if (!simplifiedAddress.equals(request.getAddress())) {
                        try {
                            KakaoAddressResponse.Document simplifiedCoordinates = kakaoApiService
                                    .getCoordinates(simplifiedAddress);
                            if (simplifiedCoordinates != null && simplifiedCoordinates.getLatitude() != null
                                    && simplifiedCoordinates.getLongitude() != null) {
                                latitude = simplifiedCoordinates.getLatitude();
                                longitude = simplifiedCoordinates.getLongitude();
                            }
                        } catch (Exception e) {
                            log.error("간소화된 주소 좌표 변환 중 오류 발생: {}", e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("좌표 변환 중 오류 발생: {}", e.getMessage());
            }
        }

        // 위치 정보 업데이트 (개별 필드 설정)
        member.setAddress(request.getAddress());
        member.setDetailAddress(request.getDetailAddress());
        member.setZonecode(request.getZonecode());
        member.setLatitude(latitude);
        member.setLongitude(longitude);

        // 지역 ID 업데이트
        if (regionId != null) {
            member.updateRegion(regionId);
        }

        memberRepository.save(member);
    }

    /**
     * 주소에서 시/구/동만 추출하여 간소화
     * 예: "서울 영등포구 여의나루로 지하 40" -> "서울 영등포구 여의동"
     */
    private String extractSimplifiedAddress(String fullAddress) {
        if (fullAddress == null || fullAddress.trim().isEmpty()) {
            return fullAddress;
        }

        try {
            // 주소를 공백으로 분리
            String[] parts = fullAddress.split("\\s+");
            if (parts.length >= 3) {
                // 시 + 구 + 동 (첫 3개 부분만 사용)
                return parts[0] + " " + parts[1] + " " + parts[2];
            } else if (parts.length >= 2) {
                // 시 + 구 (첫 2개 부분만 사용)
                return parts[0] + " " + parts[1];
            }
        } catch (Exception e) {
            log.warn("주소 간소화 중 오류 발생: {}", e.getMessage());
        }

        return fullAddress;
    }

    @Override
    public MemberInfoResponse getCurrentUserInfo(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return MemberInfoResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .phone(member.getPhone())
                .address(member.getAddress())
                .detailAddress(member.getDetailAddress())
                .zonecode(member.getZonecode())
                .latitude(member.getLatitude())
                .longitude(member.getLongitude())
                .regionId(member.getRegionId())
                // PB 관련 정보 추가
                .isPb(member.isPb())
                .pbLicenseNumber(member.getPbLicenseNumber())
                .pbExperienceYears(member.getPbExperienceYears())
                .pbSpecialties(member.getPbSpecialties())
                .pbRegion(member.getPbRegion())
                .pbRating(member.getPbRating())
                .pbTotalConsultations(member.getPbTotalConsultations())
                .pbStatus(member.getPbStatus() != null ? member.getPbStatus().name() : null)
                .pbApprovedAt(member.getPbApprovedAt() != null ? member.getPbApprovedAt().toString() : null)
                .pbApprovedBy(member.getPbApprovedBy())
                .createdAt(member.getCreatedAt() != null ? member.getCreatedAt().toString() : null)
                .lastLoginAt(member.getLastLoginAt() != null ? member.getLastLoginAt().toString() : null)
                .build();
    }
}
