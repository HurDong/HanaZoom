package com.hanazoom.domain.consultation.service;

import com.hanazoom.domain.consultation.dto.PbListResponseDto;
import com.hanazoom.domain.consultation.entity.Consultation;
import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import com.hanazoom.domain.consultation.repository.ConsultationRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.entity.PbStatus;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.pb.dto.SetAvailabilityRequestDto;
import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.hanazoom.domain.consultation.entity.ConsultationType;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PbService {

    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;
    private final ConsultationRepository consultationRepository;

    /**
     * PB 상담 가능 시간 등록
     */
    @Transactional
    public void setAvailability(SetAvailabilityRequestDto requestDto, UUID pbId) {
        Member pb = memberRepository.findById(pbId)
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다."));

        if (!pb.isPb()) {
            throw new IllegalStateException("PB 권한이 없는 사용자입니다.");
        }

        List<Consultation> availableSlots = requestDto.getAvailableSlots().stream()
                .map(slot -> {
                    long durationMinutes = Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();

                    return Consultation.builder()
                            .pb(pb)
                            .client(pb) // client_id에 PB 자신의 ID를 설정
                            .scheduledAt(slot.getStartTime())
                            .durationMinutes((int) durationMinutes)
                            .status(ConsultationStatus.AVAILABLE)
                            .consultationType(ConsultationType.SLOT) // 기본 유형 설정
                            .fee(BigDecimal.ZERO) // 기본 수수료 0으로 설정
                            .build();
                })
                .collect(Collectors.toList());

        consultationRepository.saveAll(availableSlots);
        log.info("PB {}의 상담 가능 시간 {}개가 등록되었습니다.", pbId, availableSlots.size());
    }

    /**
     * 활성 PB 목록 조회
     */
    public Page<PbListResponseDto> getActivePbList(String region, String specialty, Pageable pageable) {
        log.info("활성 PB 목록 조회: region={}, specialty={}", region, specialty);

        // 실제로는 복잡한 쿼리로 필터링
        Page<Member> pbMembers = memberRepository.findByIsPbTrueAndPbStatus(PbStatus.ACTIVE, pageable);

        return pbMembers.map(this::convertToPbListResponseDto);
    }

    /**
     * PB 상세 정보 조회
     */
    public PbListResponseDto getPbDetail(String pbId) {
        log.info("PB 상세 정보 조회: pbId={}", pbId);

        Member pb = memberRepository.findById(UUID.fromString(pbId))
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다"));

        if (!pb.isActivePb()) {
            throw new IllegalStateException("해당 PB는 현재 활성 상태가 아닙니다");
        }

        return convertToPbListResponseDto(pb);
    }

    /**
     * 지역별 PB 목록 조회
     */
    public List<PbListResponseDto> getPbListByRegion(Long regionId) {
        log.info("지역별 PB 목록 조회: regionId={}", regionId);

        List<Member> pbMembers = memberRepository.findByIsPbTrueAndPbStatusAndRegionId(
                PbStatus.ACTIVE, regionId);

        return pbMembers.stream()
                .map(this::convertToPbListResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * 전문 분야별 PB 목록 조회
     */
    public List<PbListResponseDto> getPbListBySpecialty(String specialty) {
        log.info("전문 분야별 PB 목록 조회: specialty={}", specialty);

        List<Member> pbMembers = memberRepository.findByIsPbTrueAndPbStatus(PbStatus.ACTIVE);

        return pbMembers.stream()
                .filter(pb -> pb.getPbSpecialties() != null &&
                        pb.getPbSpecialties().contains(specialty))
                .map(this::convertToPbListResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * 추천 PB 목록 조회 (평점 높은 순)
     */
    public List<PbListResponseDto> getRecommendedPbList(int limit) {
        log.info("추천 PB 목록 조회: limit={}", limit);

        List<Member> pbMembers = memberRepository.findByIsPbTrueAndPbStatusOrderByPbRatingDesc(
                PbStatus.ACTIVE, Pageable.ofSize(limit));

        return pbMembers.stream()
                .map(this::convertToPbListResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * PB 정보를 DTO로 변환
     */
    private PbListResponseDto convertToPbListResponseDto(Member pb) {
        // Optional을 사용하여 안전하게 지역명 조회
        String regionName = pb.getRegionId() != null ? regionRepository.findById(pb.getRegionId())
                .map(Region::getName)
                .orElse("") : "";

        List<String> specialties = List.of();
        if (pb.getPbSpecialties() != null && !pb.getPbSpecialties().isEmpty()) {
            // JSON 파싱 로직 (실제로는 JSON 라이브러리 사용)
            specialties = List.of(pb.getPbSpecialties().split(","));
        }

        return PbListResponseDto.builder()
                .id(pb.getId().toString())
                .name(pb.getName())
                .email(pb.getEmail())
                .phone(pb.getPhone())
                .region(pb.getPbRegion())
                .regionName(regionName)
                .rating(pb.getPbRating())
                .totalConsultations(pb.getPbTotalConsultations())
                .specialties(specialties)
                .experienceYears(pb.getPbExperienceYears())
                .profileImage(null) // 실제로는 프로필 이미지 URL
                .introduction("전문적인 투자 상담을 제공합니다.")
                .isAvailable(pb.isActivePb())
                .statusMessage(pb.isActivePb() ? "상담 가능" : "상담 불가")
                .build();
    }
}
