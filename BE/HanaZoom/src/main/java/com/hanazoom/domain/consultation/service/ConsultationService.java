package com.hanazoom.domain.consultation.service;

import com.hanazoom.domain.consultation.dto.*;
import com.hanazoom.domain.consultation.entity.Consultation;
import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import com.hanazoom.domain.consultation.entity.ConsultationType;
import com.hanazoom.domain.consultation.entity.CancelledBy;
import com.hanazoom.domain.consultation.repository.ConsultationRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final MemberRepository memberRepository;

    /**
     * 상담 예약 요청 (고객)
     */
    @Transactional
    public ConsultationResponseDto createConsultation(ConsultationRequestDto requestDto, UUID clientId) {
        log.info("상담 예약 요청: clientId={}, pbId={}, type={}", clientId, requestDto.getConsultationType());

        // 고객 정보 조회
        Member client = memberRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("고객 정보를 찾을 수 없습니다"));

        UUID pbId = UUID.fromString(requestDto.getPbId());

        // PB가 등록한 상담 가능 시간 슬롯 조회
        LocalDateTime scheduledAt = requestDto.getScheduledAt();
        Consultation availableSlot = consultationRepository
                .findByPbIdAndScheduledAtAndStatus(pbId, scheduledAt, ConsultationStatus.AVAILABLE)
                .orElseThrow(() -> new IllegalStateException("해당 시간은 예약이 불가능하거나 이미 예약된 시간입니다."));

        // 해당 슬롯이 PB가 본인 일정을 위해 등록한 것인지 확인 (client_id == pb_id)
        if (!availableSlot.getClient().getId().equals(pbId)) {
            throw new IllegalStateException("해당 시간은 다른 고객이 이미 예약 진행중입니다.");
        }

        // 수수료 설정
        BigDecimal fee = requestDto.getFee() != null ? requestDto.getFee()
                : BigDecimal.valueOf(requestDto.getConsultationType().getDefaultFee());

        // 기존 상담 슬롯에 고객 정보 업데이트 (예약 확정)
        availableSlot.bookByClient(client, requestDto.getConsultationType(), requestDto.getClientMessage(), fee);

        log.info("상담 예약 완료: consultationId={}", availableSlot.getId());

        return convertToResponseDto(availableSlot);
    }

    /**
     * 상담 승인/거절
     */
    @Transactional
    public ConsultationResponseDto approveConsultation(ConsultationApprovalDto approvalDto, UUID pbId) {
        log.info("상담 승인/거절: pbId={}, consultationId={}, approved={}",
                pbId, approvalDto.getConsultationId(), approvalDto.isApproved());

        Consultation consultation = consultationRepository.findById(UUID.fromString(approvalDto.getConsultationId()))
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));

        // PB 권한 확인
        if (!consultation.getPb().getId().equals(pbId)) {
            throw new IllegalArgumentException("해당 상담을 처리할 권한이 없습니다");
        }

        // 상태 확인
        if (!consultation.isPending()) {
            throw new IllegalStateException("대기중인 상담만 처리할 수 있습니다");
        }

        if (approvalDto.isApproved()) {
            consultation.approve(approvalDto.getPbMessage());
            log.info("상담 승인 완료: consultationId={}", consultation.getId());
        } else {
            consultation.reject(approvalDto.getPbMessage());
            log.info("상담 거절 완료: consultationId={}", consultation.getId());
        }

        return convertToResponseDto(consultation);
    }

    /**
     * 상담 시작
     */
    @Transactional
    public ConsultationResponseDto startConsultation(UUID consultationId, UUID pbId) {
        log.info("상담 시작: consultationId={}, pbId={}", consultationId, pbId);

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));

        // PB 권한 확인
        if (!consultation.getPb().getId().equals(pbId)) {
            throw new IllegalArgumentException("해당 상담을 시작할 권한이 없습니다");
        }

        // 상태 확인
        log.info("상담 상태 확인: status={}, isApproved={}, isPending={}, isCancelled={}, isCompleted={}",
                consultation.getStatus(), consultation.isApproved(), consultation.isPending(),
                consultation.isCancelled(), consultation.isCompleted());

        if (!consultation.canBeStarted()) {
            throw new IllegalStateException("상담을 시작할 수 없는 상태입니다. 현재 상태: " + consultation.getStatus());
        }

        // 미팅 URL 생성 (실제로는 화상회의 서비스 연동)
        String meetingUrl = generateMeetingUrl(consultationId);
        String meetingId = consultationId.toString();

        consultation.start(meetingUrl, meetingId);
        log.info("상담 시작 완료: consultationId={}", consultationId);

        return convertToResponseDto(consultation);
    }

    /**
     * 상담 종료
     */
    @Transactional
    public ConsultationResponseDto endConsultation(UUID consultationId, UUID pbId, String consultationNotes) {
        log.info("상담 종료: consultationId={}, pbId={}", consultationId, pbId);

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));

        // PB 권한 확인
        if (!consultation.getPb().getId().equals(pbId)) {
            throw new IllegalArgumentException("해당 상담을 종료할 권한이 없습니다");
        }

        // 상태 확인
        if (!consultation.canBeEnded()) {
            throw new IllegalStateException("상담을 종료할 수 없는 상태입니다");
        }

        consultation.end(consultationNotes);

        // PB 상담 횟수 증가
        consultation.getPb().incrementConsultationCount();
        memberRepository.save(consultation.getPb());

        log.info("상담 종료 완료: consultationId={}", consultationId);

        return convertToResponseDto(consultation);
    }

    /**
     * 상담 취소
     */
    @Transactional
    public ConsultationResponseDto cancelConsultation(UUID consultationId, UUID userId, String reason,
            boolean isClient) {
        log.info("상담 취소: consultationId={}, userId={}, isClient={}", consultationId, userId, isClient);

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));

        // 권한 확인
        boolean hasPermission = isClient ? consultation.getClient().getId().equals(userId)
                : consultation.getPb().getId().equals(userId);

        if (!hasPermission) {
            throw new IllegalArgumentException("해당 상담을 취소할 권한이 없습니다");
        }

        // 상태 확인
        if (!consultation.canBeCancelled()) {
            throw new IllegalStateException("상담을 취소할 수 없는 상태입니다");
        }

        CancelledBy cancelledBy = isClient ? CancelledBy.CLIENT : CancelledBy.PB;
        consultation.cancel(reason, cancelledBy);

        log.info("상담 취소 완료: consultationId={}", consultationId);

        return convertToResponseDto(consultation);
    }

    /**
     * 상담 평가
     */
    @Transactional
    public ConsultationResponseDto rateConsultation(ConsultationRatingDto ratingDto, UUID clientId) {
        log.info("상담 평가: consultationId={}, clientId={}, rating={}",
                ratingDto.getConsultationId(), clientId, ratingDto.getRating());

        Consultation consultation = consultationRepository.findById(UUID.fromString(ratingDto.getConsultationId()))
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));

        // 고객 권한 확인
        if (!consultation.getClient().getId().equals(clientId)) {
            throw new IllegalArgumentException("해당 상담을 평가할 권한이 없습니다");
        }

        // 상태 확인
        if (!consultation.isCompleted()) {
            throw new IllegalStateException("완료된 상담만 평가할 수 있습니다");
        }

        consultation.rateByClient(ratingDto.getRating(), ratingDto.getFeedback());

        // PB 평점 업데이트
        updatePbRating(consultation.getPb());

        log.info("상담 평가 완료: consultationId={}", consultation.getId());

        return convertToResponseDto(consultation);
    }

    /**
     * 고객별 상담 목록 조회
     */
    public Page<ConsultationResponseDto> getConsultationsByClient(UUID clientId, Pageable pageable) {
        Page<Consultation> consultations = consultationRepository.findByClientId(clientId, pageable);
        return consultations.map(this::convertToResponseDto);
    }

    /**
     * PB별 상담 목록 조회
     */
    public Page<ConsultationResponseDto> getConsultationsByPb(UUID pbId, Pageable pageable) {
        Page<Consultation> consultations = consultationRepository.findByPbId(pbId, pageable);
        return consultations.map(this::convertToResponseDto);
    }

    /**
     * PB별 캘린더용 상담 목록 조회 (날짜 범위별)
     */
    public List<ConsultationResponseDto> getPbCalendarConsultations(UUID pbId, String startDate, String endDate) {
        LocalDateTime start = null;
        LocalDateTime end = null;

        if (startDate != null && !startDate.isEmpty()) {
            start = LocalDateTime.parse(startDate + "T00:00:00");
        }
        if (endDate != null && !endDate.isEmpty()) {
            end = LocalDateTime.parse(endDate + "T23:59:59");
        }

        List<Consultation> consultations;
        if (start != null && end != null) {
            consultations = consultationRepository.findByPbIdAndScheduledAtBetween(pbId, start, end);
        } else if (start != null) {
            consultations = consultationRepository.findByPbIdAndScheduledAtAfter(pbId, start);
        } else if (end != null) {
            consultations = consultationRepository.findByPbIdAndScheduledAtBefore(pbId, end);
        } else {
            // 날짜 범위가 없으면 최근 30일간의 상담 조회
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            consultations = consultationRepository.findByPbIdAndScheduledAtAfter(pbId, thirtyDaysAgo);
        }

        return consultations.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * PB 대시보드 정보 조회
     */
    public PbDashboardDto getPbDashboard(UUID pbId) {
        Member pb = memberRepository.findById(pbId)
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다"));

        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime tomorrow = today.plusDays(1);

        // 오늘의 상담
        List<Consultation> todayConsultations = consultationRepository
                .findByPbIdAndScheduledAtBetween(pbId, today, tomorrow);

        // 대기중인 상담
        List<Consultation> pendingConsultations = consultationRepository
                .findPendingConsultationsByPbId(pbId, ConsultationStatus.PENDING);

        // 진행중인 상담
        List<Consultation> inProgressConsultations = consultationRepository
                .findInProgressConsultationsByPbId(pbId, ConsultationStatus.IN_PROGRESS);

        // 최근 상담 (최대 5개)
        Page<Consultation> recentConsultations = consultationRepository
                .findRecentConsultationsByPbId(pbId, Pageable.ofSize(5));

        // 통계 정보
        long totalCompleted = consultationRepository.countCompletedConsultationsByPbId(pbId,
                ConsultationStatus.COMPLETED);
        Double averageRating = consultationRepository.getAverageRatingByPbId(pbId);

        // 상담 유형별 통계
        List<Object[]> typeStats = consultationRepository.getConsultationTypeStatistics(pbId,
                ConsultationStatus.COMPLETED);
        Map<String, Long> typeStatistics = typeStats.stream()
                .collect(Collectors.toMap(
                        stat -> ((ConsultationType) stat[0]).getDisplayName(),
                        stat -> (Long) stat[1]));

        // 다음 예정된 상담
        Consultation nextConsultation = todayConsultations.stream()
                .filter(c -> c.isApproved() && c.getScheduledAt().isAfter(LocalDateTime.now()))
                .min((c1, c2) -> c1.getScheduledAt().compareTo(c2.getScheduledAt()))
                .orElse(null);

        return PbDashboardDto.builder()
                .pbId(pbId.toString())
                .pbName(pb.getName())
                .pbRegion(pb.getPbRegion())
                .pbRating(pb.getPbRating())
                .totalConsultations(pb.getPbTotalConsultations())
                .todayConsultations(todayConsultations.stream().map(this::convertToSummaryDto).toList())
                .todayConsultationCount(todayConsultations.size())
                .pendingConsultations(pendingConsultations.stream().map(this::convertToSummaryDto).toList())
                .pendingConsultationCount(pendingConsultations.size())
                .inProgressConsultations(inProgressConsultations.stream().map(this::convertToSummaryDto).toList())
                .inProgressConsultationCount(inProgressConsultations.size())
                .recentConsultations(recentConsultations.getContent().stream().map(this::convertToSummaryDto).toList())
                .totalCompletedConsultations(totalCompleted)
                .averageRating(averageRating)
                .consultationTypeStatistics(typeStatistics)
                .nextConsultation(nextConsultation != null ? convertToSummaryDto(nextConsultation) : null)
                .isActive(pb.isActivePb())
                .statusMessage(pb.isActivePb() ? "활성" : "비활성")
                .build();
    }

    /**
     * 상담 상세 정보 조회
     */
    public ConsultationResponseDto getConsultationById(UUID consultationId, UUID userId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));

        // 권한 확인 (고객 또는 PB)
        boolean hasPermission = consultation.getClient().getId().equals(userId) ||
                consultation.getPb().getId().equals(userId);

        if (!hasPermission) {
            throw new IllegalArgumentException("해당 상담 정보를 조회할 권한이 없습니다");
        }

        return convertToResponseDto(consultation);
    }

    /**
     * 평가 가능한 상담 목록 조회
     */
    public List<ConsultationResponseDto> getConsultationsForRating(UUID clientId) {
        List<Consultation> consultations = consultationRepository.findCompletedConsultationsForRating(clientId,
                ConsultationStatus.COMPLETED);
        return consultations.stream().map(this::convertToResponseDto).toList();
    }

    /**
     * 가능한 상담 시간 조회
     */
    public List<String> getAvailableTimes(String pbId, String date, Integer durationMinutes) {
        log.info("가능한 상담 시간 조회: pbId={}, date={}", pbId, date);

        try {
            UUID pbUuid = UUID.fromString(pbId);
            LocalDate targetDate = LocalDate.parse(date);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();

            // 해당 날짜에 PB가 AVAILABLE로 등록한 상담 시간 조회
            List<Consultation> availableSlots = consultationRepository
                    .findByPbIdAndScheduledAtBetweenAndStatus(pbUuid, startOfDay, endOfDay,
                            ConsultationStatus.AVAILABLE);

            return availableSlots.stream()
                    // PB 본인이 클라이언트로 등록된 슬롯만 필터링
                    .filter(slot -> slot.getClient().getId().equals(slot.getPb().getId()))
                    .map(consultation -> consultation.getScheduledAt().toLocalTime().toString())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("가능한 상담 시간 조회 실패", e);
            throw new RuntimeException("가능한 상담 시간 조회에 실패했습니다", e);
        }
    }

    /**
     * 모든 시간 슬롯과 예약 상태 조회 (예약된 시간 포함)
     */
    public Map<String, Boolean> getTimeSlotsWithStatus(String pbId, String date, Integer durationMinutes) {
        log.info("시간 슬롯 상태 조회: pbId={}, date={}, durationMinutes={}", pbId, date, durationMinutes);

        try {
            UUID pbUuid = UUID.fromString(pbId);
            LocalDate targetDate = LocalDate.parse(date);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();

            // 해당 날짜에 PB가 등록한 모든 상담 시간 조회 (예약된 것 포함)
            List<Consultation> allSlots = consultationRepository
                    .findByPbIdAndScheduledAtBetween(pbUuid, startOfDay, endOfDay);

            return allSlots.stream()
                    .collect(Collectors.toMap(
                            consultation -> consultation.getScheduledAt().toLocalTime().toString(),
                            // PB 본인이 클라이언트로 등록되어 있고, 상태가 AVAILABLE인 경우만 true
                            consultation -> consultation.getStatus() == ConsultationStatus.AVAILABLE &&
                                    consultation.getClient().getId().equals(consultation.getPb().getId())));

        } catch (Exception e) {
            log.error("시간 슬롯 상태 조회 실패", e);
            throw new RuntimeException("시간 슬롯 상태 조회에 실패했습니다", e);
        }
    }

    // Private helper methods

    private String generateMeetingUrl(UUID consultationId) {
        // 실제로는 화상회의 서비스 (Zoom, Google Meet 등) 연동
        return "https://meet.hanazoom.com/" + consultationId.toString();
    }

    private void updatePbRating(Member pb) {
        Double averageRating = consultationRepository.getAverageRatingByPbId(pb.getId());
        if (averageRating != null) {
            pb.updatePbRating(averageRating);
            memberRepository.save(pb);
        }
    }

    private ConsultationResponseDto convertToResponseDto(Consultation consultation) {
        return ConsultationResponseDto.builder()
                .id(consultation.getId())
                .clientId(consultation.getClient() != null ? consultation.getClient().getId().toString() : null)
                .clientName(consultation.getClient() != null ? consultation.getClient().getName() : null)
                .clientPhone(consultation.getClient() != null ? consultation.getClient().getPhone() : null)
                .clientEmail(consultation.getClient() != null ? consultation.getClient().getEmail() : null)
                .pbId(consultation.getPb().getId().toString())
                .pbName(consultation.getPb().getName())
                .pbPhone(consultation.getPb().getPhone())
                .pbEmail(consultation.getPb().getEmail())
                .consultationType(consultation.getConsultationType())
                .status(consultation.getStatus())
                .scheduledAt(consultation.getScheduledAt())
                .durationMinutes(consultation.getDurationMinutes())
                .fee(consultation.getFee())
                .clientMessage(consultation.getClientMessage())
                .pbMessage(consultation.getPbMessage())
                .consultationNotes(consultation.getConsultationNotes())
                .meetingUrl(consultation.getMeetingUrl())
                .meetingId(consultation.getMeetingId())
                .startedAt(consultation.getStartedAt())
                .endedAt(consultation.getEndedAt())
                .clientRating(consultation.getClientRating())
                .clientFeedback(consultation.getClientFeedback())
                .isCancelled(consultation.isCancelled())
                .cancellationReason(consultation.getCancellationReason())
                .cancelledAt(consultation.getCancelledAt())
                .cancelledBy(consultation.getCancelledBy())
                .createdAt(consultation.getCreatedAt())
                .updatedAt(consultation.getUpdatedAt())
                .actualDurationMinutes(consultation.getActualDurationMinutes())
                .canBeCancelled(consultation.canBeCancelled())
                .canBeStarted(consultation.canBeStarted())
                .canBeEnded(consultation.canBeEnded())
                .canBeRated(consultation.isCompleted() && consultation.getClientRating() == null)
                .build();
    }

    private ConsultationSummaryDto convertToSummaryDto(Consultation consultation) {
        return ConsultationSummaryDto.builder()
                .id(consultation.getId())
                .clientName(consultation.getClient() != null ? consultation.getClient().getName() : "미정")
                .pbName(consultation.getPb().getName())
                .consultationType(consultation.getConsultationType())
                .status(consultation.getStatus())
                .scheduledAt(consultation.getScheduledAt())
                .durationMinutes(consultation.getDurationMinutes())
                .fee(consultation.getFee())
                .clientMessage(consultation.getClientMessage())
                .isCancelled(consultation.isCancelled())
                .createdAt(consultation.getCreatedAt())
                .statusDisplayName(consultation.getStatus().getDisplayName())
                .typeDisplayName(
                        consultation.getConsultationType() != null ? consultation.getConsultationType().getDisplayName()
                                : "미정")
                .canBeCancelled(consultation.canBeCancelled())
                .canBeStarted(consultation.canBeStarted())
                .canBeEnded(consultation.canBeEnded())
                .build();
    }

    // WebSocket용 메서드들 추가

    /**
     * WebSocket 상담 참여 처리
     */
    public ConsultationJoinResponse joinConsultation(UUID consultationId, String userId, String clientId) {
        log.info("WebSocket 상담 참여 처리: consultationId={}, userId={}, clientId={}", consultationId, userId, clientId);

        try {
            // 참여자 정보 생성
            Map<String, Object> participant = new HashMap<>();
            participant.put("userId", userId);
            participant.put("clientId", clientId);
            participant.put("role", "participant");
            participant.put("joinedAt", System.currentTimeMillis());

            // 참여자 목록 생성
            Map<String, Object> participants = new HashMap<>();
            participants.put(userId, participant);

            // 응답 생성
            ConsultationJoinResponse response = new ConsultationJoinResponse();
            response.setSuccess(true);
            response.setConsultationId(consultationId.toString());
            response.setParticipants(participants);
            response.setMessage("상담에 성공적으로 참여했습니다.");

            log.info("WebSocket 상담 참여 성공: consultationId={}, userId={}", consultationId, userId);
            return response;

        } catch (Exception e) {
            log.error("WebSocket 상담 참여 처리 중 오류: consultationId={}, userId={}", consultationId, userId, e);

            ConsultationJoinResponse response = new ConsultationJoinResponse();
            response.setSuccess(false);
            response.setError("상담 참여에 실패했습니다: " + e.getMessage());
            return response;
        }
    }

    /**
     * WebSocket 상담 나가기 처리
     */
    public void leaveConsultation(UUID consultationId, String userId) {
        log.info("WebSocket 상담 나가기 처리: consultationId={}, userId={}", consultationId, userId);

        try {
            // 상담 나가기 로직 구현
            // 실제로는 데이터베이스에서 참여자 정보를 업데이트하거나 제거
            log.info("WebSocket 상담 나가기 성공: consultationId={}, userId={}", consultationId, userId);

        } catch (Exception e) {
            log.error("WebSocket 상담 나가기 처리 중 오류: consultationId={}, userId={}", consultationId, userId, e);
        }
    }
}
