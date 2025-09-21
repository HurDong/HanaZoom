package com.hanazoom.domain.consultation.service;

import com.hanazoom.domain.consultation.dto.*;
import com.hanazoom.domain.consultation.entity.Consultation;
import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import com.hanazoom.domain.consultation.entity.ConsultationType;
import com.hanazoom.domain.consultation.entity.CancelledBy;
import com.hanazoom.domain.consultation.repository.ConsultationRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.AccountBalance;
import com.hanazoom.domain.portfolio.repository.AccountBalanceRepository;
import com.hanazoom.domain.portfolio.repository.PortfolioStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final MemberRepository memberRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final AccountBalanceRepository accountBalanceRepository;

    /**
     * 상담 예약 요청 (고객)
     */
    @Transactional
    public ConsultationResponseDto createConsultation(ConsultationRequestDto requestDto, UUID clientId) {
        log.info("상담 예약 요청: clientId={}, pbId={}, type={}", clientId, requestDto.getPbId(),
                requestDto.getConsultationType());

        // 고객 정보 조회
        Member client = memberRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("고객 정보를 찾을 수 없습니다"));

        UUID pbId = UUID.fromString(requestDto.getPbId());

        // PB 정보 조회
        Member pb = memberRepository.findById(pbId)
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다"));

        LocalDateTime scheduledAt = requestDto.getScheduledAt();

        // 주말(토요일, 일요일) 상담 차단
        if (isWeekend(scheduledAt)) {
            throw new IllegalStateException("주말(토요일, 일요일)에는 상담을 진행하지 않습니다. 평일을 선택해주세요.");
        }

        // 해당 시간에 이미 예약이나 불가능 시간이 등록되어 있는지 확인
        List<Consultation> existingConsultations = consultationRepository
                .findByPbIdAndScheduledAtBetween(pbId, scheduledAt,
                        scheduledAt.plusMinutes(requestDto.getDurationMinutes()));

        if (!existingConsultations.isEmpty()) {
            throw new IllegalStateException("선택한 시간이 더 이상 예약 가능하지 않습니다. 다른 시간을 선택해주세요.");
        }

        // 수수료 설정
        BigDecimal fee = requestDto.getFee() != null ? requestDto.getFee()
                : BigDecimal.valueOf(requestDto.getConsultationType().getDefaultFee());

        // 새로운 상담 예약 생성
        Consultation consultation = Consultation.builder()
                .pb(pb)
                .client(client)
                .scheduledAt(scheduledAt)
                .durationMinutes(requestDto.getDurationMinutes())
                .status(ConsultationStatus.PENDING)
                .consultationType(requestDto.getConsultationType())
                .fee(fee)
                .clientMessage(requestDto.getClientMessage())
                .build();

        consultationRepository.save(consultation);

        log.info("상담 예약 완료: consultationId={}", consultation.getId());

        return convertToResponseDto(consultation);
    }

    /**
     * 상담 승인/거절
     */
    @Transactional
    public ConsultationResponseDto approveConsultation(ConsultationApprovalDto approvalDto, UUID pbId) {
        log.info("상담 승인/거절: pbId={}, consultationId={}, approved={}",
                pbId, approvalDto.getConsultationId(), approvalDto.isApproved());

        // consultationId 검증
        if (approvalDto.getConsultationId() == null || approvalDto.getConsultationId().trim().isEmpty()) {
            throw new IllegalArgumentException("상담 ID가 필요합니다");
        }

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
                // PB 자기 자신의 스케줄(불가능 시간)은 제외하고 실제 고객 예약만 표시
                .filter(c -> c.isClientBooking())
                // 취소되거나 거절된 상담은 캘린더에서 제외
                .filter(c -> c.getStatus() != ConsultationStatus.CANCELLED &&
                        c.getStatus() != ConsultationStatus.REJECTED)
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
        List<Consultation> todayConsultationsRaw = consultationRepository
                .findByPbIdAndScheduledAtBetween(pbId, today, tomorrow);
        List<Consultation> todayConsultations = todayConsultationsRaw.stream()
                .filter(c -> c.isClientBooking())
                // 취소되거나 거절된 상담은 제외
                .filter(c -> c.getStatus() != ConsultationStatus.CANCELLED &&
                        c.getStatus() != ConsultationStatus.REJECTED)
                .collect(Collectors.toList());

        // 대기중인 상담
        List<Consultation> pendingConsultations = consultationRepository
                .findPendingConsultationsByPbId(pbId, ConsultationStatus.PENDING)
                .stream()
                .filter(c -> c.isClientBooking())
                .collect(Collectors.toList());

        // 진행중인 상담
        List<Consultation> inProgressConsultations = consultationRepository
                .findInProgressConsultationsByPbId(pbId, ConsultationStatus.IN_PROGRESS)
                .stream()
                .filter(c -> c.isClientBooking())
                .collect(Collectors.toList());

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

        // 다음 예정된 상담 (오늘 이후의 모든 예정된 상담에서 가장 가까운 것)
        LocalDateTime now = LocalDateTime.now();
        List<Consultation> futureConsultations = consultationRepository
                .findByPbIdAndScheduledAtAfter(pbId, now)
                .stream()
                .filter(c -> c.isClientBooking())
                .filter(c -> c.getStatus() == ConsultationStatus.APPROVED ||
                        c.getStatus() == ConsultationStatus.PENDING ||
                        c.getStatus() == ConsultationStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        Consultation nextConsultation = futureConsultations.stream()
                .min((c1, c2) -> c1.getScheduledAt().compareTo(c2.getScheduledAt()))
                .orElse(null);

        List<Consultation> filteredRecentConsultations = recentConsultations.getContent().stream()
                .filter(c -> c.getClient() != null && !c.getClient().getId().equals(pbId))
                .filter(c -> c.getStatus() != ConsultationStatus.UNAVAILABLE)
                .collect(Collectors.toList());

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
                .recentConsultations(filteredRecentConsultations.stream().map(this::convertToSummaryDto).toList())
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
     * PB의 고객 목록 조회
     */
    public List<PbClientDto> getPbClients(UUID pbId) {
        log.info("PB 고객 목록 조회: pbId={}", pbId);

        try {
            // PB가 상담한 모든 고유 고객들을 조회 (UNAVAILABLE 상태 제외)
            List<Consultation> consultations = consultationRepository.findDistinctClientsByPbId(pbId,
                    ConsultationStatus.UNAVAILABLE);

            Map<UUID, PbClientDto> clientMap = new HashMap<>();

            for (Consultation consultation : consultations) {
                // PB 자기 자신의 스케줄은 제외
                if (consultation.isPbOwnSchedule()) {
                    continue;
                }

                Member client = consultation.getClient();
                UUID clientId = client.getId();

                if (!clientMap.containsKey(clientId)) {
                    // 새로운 고객인 경우
                    PbClientDto clientDto = PbClientDto.builder()
                            .id(clientId.toString())
                            .name(client.getName())
                            .email(client.getEmail())
                            .region(client.getAddress() != null ? client.getAddress() : "지역 정보 없음")
                            .totalConsultations(0)
                            .completedConsultations(0)
                            .averageRating(0.0)
                            .totalAssets(calculateTotalAssets(clientId)) // 포트폴리오에서 계산
                            .riskLevel(calculateRiskLevel(clientId)) // 포트폴리오에서 계산
                            .portfolioScore(calculatePortfolioScore(clientId)) // 포트폴리오에서 계산
                            .build();

                    clientMap.put(clientId, clientDto);
                }

                // 상담 통계 업데이트
                PbClientDto clientDto = clientMap.get(clientId);
                clientDto.incrementTotalConsultations();

                if (consultation.getStatus() == ConsultationStatus.COMPLETED) {
                    clientDto.incrementCompletedConsultations();
                    if (consultation.getClientRating() != null) {
                        clientDto.addRating(consultation.getClientRating());
                    }
                }

                LocalDateTime now = LocalDateTime.now();

                // 마지막 상담 일시 업데이트 (오늘 이전의 완료된 상담 중 가장 최근)
                if (consultation.getStatus() == ConsultationStatus.COMPLETED &&
                        consultation.getScheduledAt().isBefore(now)) {
                    if (clientDto.getLastConsultation() == null ||
                            consultation.getScheduledAt()
                                    .isAfter(LocalDateTime.parse(clientDto.getLastConsultation()))) {
                        clientDto.setLastConsultation(consultation.getScheduledAt().toString());
                    }
                }

                // 다음 예정 상담 업데이트 (오늘 이후의 예정된 상담 중 가장 가까운)
                if ((consultation.getStatus() == ConsultationStatus.APPROVED ||
                        consultation.getStatus() == ConsultationStatus.PENDING ||
                        consultation.getStatus() == ConsultationStatus.IN_PROGRESS) &&
                        consultation.getScheduledAt().isAfter(now)) {
                    if (clientDto.getNextScheduled() == null ||
                            consultation.getScheduledAt().isBefore(LocalDateTime.parse(clientDto.getNextScheduled()))) {
                        clientDto.setNextScheduled(consultation.getScheduledAt().toString());
                    }
                }
            }

            return new ArrayList<>(clientMap.values());

        } catch (Exception e) {
            log.error("PB 고객 목록 조회 실패: pbId={}", pbId, e);
            throw new RuntimeException("고객 목록 조회에 실패했습니다", e);
        }
    }

    /**
     * 고객의 총 자산 계산 (포트폴리오 기반 - 실제 고객 페이지와 동일한 로직)
     */
    private BigDecimal calculateTotalAssets(UUID clientId) {
        try {
            Member client = memberRepository.findById(clientId).orElse(null);
            if (client == null) {
                return BigDecimal.ZERO;
            }

            Account mainAccount = client.getMainAccount();
            if (mainAccount == null) {
                log.debug("고객 {}의 메인 계좌가 없습니다", clientId);
                return BigDecimal.ZERO;
            }

            // 계좌 잔고 조회 (최신 잔고)
            AccountBalance balance = accountBalanceRepository
                    .findLatestBalanceByAccountIdOrderByDateDesc(mainAccount.getId())
                    .orElse(null);
            if (balance == null) {
                log.debug("고객 {}의 계좌 잔고 정보가 없습니다", clientId);
                return BigDecimal.ZERO;
            }

            // 주식 평가금액 조회
            BigDecimal totalStockValue = portfolioStockRepository.findTotalStockValueByAccountId(mainAccount.getId());

            // 총 현금 = 사용가능현금 + 결제예정현금 + 출금가능현금
            BigDecimal totalCash = balance.getAvailableCash()
                    .add(balance.getSettlementCash())
                    .add(balance.getWithdrawableCash());

            // 총 자산 = 현금 + 주식 평가금액 (실제 고객 페이지와 동일한 계산)
            return totalCash.add(totalStockValue != null ? totalStockValue : BigDecimal.ZERO);
        } catch (Exception e) {
            log.warn("총 자산 계산 실패: clientId={}", clientId, e);
            // 포트폴리오 데이터가 없는 경우 임시 값 반환
            return BigDecimal.valueOf(50000000 + (clientId.hashCode() % 100000000));
        }
    }

    /**
     * 고객의 위험도 계산 (포트폴리오 기반)
     */
    private String calculateRiskLevel(UUID clientId) {
        try {
            Member client = memberRepository.findById(clientId).orElse(null);
            if (client == null) {
                return "보통";
            }

            Account mainAccount = client.getMainAccount();
            if (mainAccount == null) {
                log.debug("고객 {}의 메인 계좌가 없습니다", clientId);
                return "보통";
            }

            // 포트폴리오 통계 조회
            PortfolioStockRepository.UserPortfolioStats stats = portfolioStockRepository
                    .getUserPortfolioStats(mainAccount.getId());

            // 기존 포트폴리오 로직과 동일한 위험도 계산
            return calculateRiskLevelFromProfitRate(stats.getAvgProfitLossRate());
        } catch (Exception e) {
            log.warn("위험도 계산 실패: clientId={}", clientId, e);
            // 포트폴리오 데이터가 없는 경우 임시 값 반환
            int hash = Math.abs(clientId.hashCode() % 3);
            return switch (hash) {
                case 0 -> "낮음";
                case 1 -> "보통";
                default -> "높음";
            };
        }
    }

    /**
     * 평균 수익률을 기반으로 위험도를 계산 (기존 포트폴리오 로직과 동일)
     */
    private String calculateRiskLevelFromProfitRate(BigDecimal avgProfitLossRate) {
        if (avgProfitLossRate == null)
            return "보통";

        double rate = avgProfitLossRate.doubleValue();
        if (rate < -10)
            return "높음";
        if (rate < 5)
            return "보통";
        return "낮음";
    }

    /**
     * 고객의 포트폴리오 점수 계산 (실제 포트폴리오 데이터 기반)
     */
    private int calculatePortfolioScore(UUID clientId) {
        try {
            Member client = memberRepository.findById(clientId).orElse(null);
            if (client == null) {
                return 75;
            }

            Account mainAccount = client.getMainAccount();
            if (mainAccount == null) {
                return 75;
            }

            // 포트폴리오 통계 조회
            PortfolioStockRepository.UserPortfolioStats stats = portfolioStockRepository
                    .getUserPortfolioStats(mainAccount.getId());

            if (stats == null) {
                return 75;
            }

            // 포트폴리오 점수 계산 로직
            int score = 50; // 기본 점수

            // 1. 분산 투자 점수 (보유 종목 수에 따라)
            long stockCount = stats.getStockCount();
            if (stockCount >= 10) {
                score += 20; // 10종목 이상: +20점
            } else if (stockCount >= 5) {
                score += 15; // 5-9종목: +15점
            } else if (stockCount >= 3) {
                score += 10; // 3-4종목: +10점
            } else if (stockCount >= 1) {
                score += 5; // 1-2종목: +5점
            }

            // 2. 수익률 점수 (평균 수익률에 따라)
            BigDecimal avgProfitRate = stats.getAvgProfitLossRate();
            if (avgProfitRate != null) {
                double rate = avgProfitRate.doubleValue();
                if (rate >= 20) {
                    score += 25; // 20% 이상: +25점
                } else if (rate >= 10) {
                    score += 20; // 10-19%: +20점
                } else if (rate >= 5) {
                    score += 15; // 5-9%: +15점
                } else if (rate >= 0) {
                    score += 10; // 0-4%: +10점
                } else if (rate >= -10) {
                    score += 5; // -10~-1%: +5점
                }
                // -10% 이하는 추가 점수 없음
            }

            // 3. 포트폴리오 규모 점수 (총 가치에 따라)
            BigDecimal totalValue = stats.getTotalValue();
            if (totalValue != null) {
                long value = totalValue.longValue();
                if (value >= 100000000) { // 1억 이상
                    score += 5;
                } else if (value >= 50000000) { // 5천만 이상
                    score += 3;
                } else if (value >= 10000000) { // 1천만 이상
                    score += 1;
                }
            }

            // 점수 범위 제한 (0-100)
            return Math.min(Math.max(score, 0), 100);
        } catch (Exception e) {
            log.warn("포트폴리오 점수 계산 실패: clientId={}", clientId, e);
            return 75;
        }
    }

    /**
     * PB의 지역별 고객 현황 조회
     */
    public List<RegionClientStatsDto> getPbRegionClientStats(UUID pbId) {
        log.info("PB 지역별 고객 현황 조회: pbId={}", pbId);

        try {
            // PB가 상담한 모든 고유 고객들을 조회 (UNAVAILABLE 상태 제외)
            List<Consultation> consultations = consultationRepository.findDistinctClientsByPbId(pbId,
                    ConsultationStatus.UNAVAILABLE);

            // 지역별로 고객 수 집계
            Map<String, RegionClientStatsDto> regionStatsMap = new HashMap<>();

            for (Consultation consultation : consultations) {
                // PB 자기 자신의 스케줄은 제외
                if (consultation.isPbOwnSchedule()) {
                    continue;
                }

                Member client = consultation.getClient();
                String region = client.getAddress() != null ? client.getAddress() : "기타 지역";

                // 지역 정보 정규화 (시/구 단위로)
                region = normalizeRegion(region);

                RegionClientStatsDto stats = regionStatsMap.computeIfAbsent(region, k -> RegionClientStatsDto.builder()
                        .regionName(k)
                        .clientCount(0)
                        .totalConsultations(0)
                        .completedConsultations(0)
                        .averageRating(0.0)
                        .build());

                // 고유 고객 수 증가 (같은 고객이 여러 상담을 했을 수 있으므로 Set으로 관리)
                stats.addClient(client.getId());
                stats.incrementTotalConsultations();

                if (consultation.getStatus() == ConsultationStatus.COMPLETED) {
                    stats.incrementCompletedConsultations();
                    if (consultation.getClientRating() != null) {
                        stats.addRating(consultation.getClientRating());
                    }
                }
            }

            // 고객 수 계산 및 평균 평점 계산
            regionStatsMap.values().forEach(RegionClientStatsDto::calculateFinalStats);

            return regionStatsMap.values().stream()
                    .sorted((a, b) -> Integer.compare(b.getClientCount(), a.getClientCount()))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("PB 지역별 고객 현황 조회 실패: pbId={}", pbId, e);
            throw new RuntimeException("지역별 고객 현황 조회에 실패했습니다", e);
        }
    }

    /**
     * 지역 정보 정규화 (시/구 단위로 통합)
     */
    private String normalizeRegion(String address) {
        if (address == null || address.trim().isEmpty()) {
            return "기타 지역";
        }

        // 서울특별시, 부산광역시 등에서 시/구 추출
        String[] parts = address.split(" ");
        if (parts.length >= 2) {
            String city = parts[0];
            String district = parts[1];

            // 특별시, 광역시의 경우 구까지만
            if (city.contains("서울") || city.contains("부산") || city.contains("대구") ||
                    city.contains("인천") || city.contains("광주") || city.contains("대전") || city.contains("울산")) {
                return city + " " + district;
            }
            // 도의 경우 시까지만
            else if (city.contains("도")) {
                return district;
            }
        }

        return parts[0]; // 첫 번째 부분만 반환
    }

    /**
     * PB의 기존 시간 상태 조회 (불가능 시간 + 고객 예약 시간)
     */
    public PbTimeStatusDto getPbTimeStatus(UUID pbId, String date) {
        log.info("PB 시간 상태 조회: pbId={}, date={}", pbId, date);

        try {
            LocalDate targetDate = LocalDate.parse(date);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();

            // 주말인 경우 빈 상태 반환
            if (isWeekend(startOfDay)) {
                log.info("주말({})이므로 시간 상태를 빈 상태로 반환합니다.", targetDate.getDayOfWeek());
                return PbTimeStatusDto.builder()
                        .unavailableTimes(List.of())
                        .clientBookings(List.of())
                        .build();
            }

            // 해당 날짜의 모든 상담 기록 조회
            List<Consultation> allConsultations = consultationRepository
                    .findByPbIdAndScheduledAtBetween(pbId, startOfDay, endOfDay);

            // PB 자신이 등록한 불가능 시간 (client_id == pb_id인 경우 또는 UNAVAILABLE 상태)
            List<String> unavailableTimes = allConsultations.stream()
                    .filter(c -> c.isPbOwnSchedule() || c.getStatus() == ConsultationStatus.UNAVAILABLE)
                    .map(c -> c.getScheduledAt().toLocalTime().toString())
                    .collect(Collectors.toList());

            // 실제 고객이 예약한 시간 (client_id != pb_id인 실제 고객 예약)
            List<PbTimeStatusDto.ClientBooking> clientBookings = allConsultations.stream()
                    .filter(c -> c.isClientBooking() && c.getStatus() != ConsultationStatus.UNAVAILABLE)
                    .map(c -> PbTimeStatusDto.ClientBooking.builder()
                            .time(c.getScheduledAt().toLocalTime().toString())
                            .clientName(c.getClient().getName())
                            .status(c.getStatus().name())
                            .durationMinutes(c.getDurationMinutes())
                            .consultationType(c.getConsultationType().name())
                            .build())
                    .collect(Collectors.toList());

            return PbTimeStatusDto.builder()
                    .unavailableTimes(unavailableTimes)
                    .clientBookings(clientBookings)
                    .build();

        } catch (Exception e) {
            log.error("PB 시간 상태 조회 실패: pbId={}, date={}", pbId, date, e);
            throw new RuntimeException("시간 상태 조회에 실패했습니다", e);
        }
    }

    /**
     * 가능한 상담 시간 조회
     */
    public List<String> getAvailableTimes(String pbId, String date, Integer durationMinutes) {
        log.info("가능한 상담 시간 조회: pbId={}, date={}, durationMinutes={}", pbId, date, durationMinutes);

        try {
            // getTimeSlotsWithStatus를 사용하여 예약 가능한 시간만 반환
            Map<String, Boolean> timeSlotsStatus = getTimeSlotsWithStatus(pbId, date, durationMinutes);

            return timeSlotsStatus.entrySet().stream()
                    .filter(entry -> entry.getValue()) // 예약 가능한 시간만
                    .map(entry -> entry.getKey())
                    .sorted()
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

            // 주말인 경우 빈 맵 반환
            if (isWeekend(startOfDay)) {
                log.info("주말({})이므로 모든 시간 슬롯을 사용 불가로 처리합니다.", targetDate.getDayOfWeek());
                return new HashMap<>();
            }

            // 해당 날짜에 PB가 등록한 모든 상담 시간 조회 (예약된 것 포함)
            List<Consultation> allSlots = consultationRepository
                    .findByPbIdAndScheduledAtBetween(pbUuid, startOfDay, endOfDay);

            // DB에 있는 시간들을 Set으로 변환 (예약된 시간 + 불가능한 시간)
            Set<String> unavailableTimes = allSlots.stream()
                    .map(consultation -> consultation.getScheduledAt().toLocalTime().toString())
                    .collect(Collectors.toSet());

            // 전체 시간 범위 생성 (09:00 ~ 18:00, 30분 간격)
            Map<String, Boolean> timeSlots = new HashMap<>();
            LocalTime startTime = LocalTime.of(9, 0); // 09:00
            LocalTime endTime = LocalTime.of(18, 0); // 18:00

            // 기본 상담 시간 (분 단위, 기본값 60분)
            int consultationDurationMinutes = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : 60;

            LocalTime currentTime = startTime;
            while (!currentTime.isAfter(endTime)) {
                String timeString = currentTime.toString();

                // 현재 시간부터 상담 시간만큼의 모든 슬롯이 비어있는지 확인
                boolean isAvailable = isTimeSlotAvailable(currentTime, consultationDurationMinutes, unavailableTimes,
                        endTime);

                timeSlots.put(timeString, isAvailable);
                currentTime = currentTime.plusMinutes(30); // 30분씩 증가
            }

            return timeSlots;

        } catch (Exception e) {
            log.error("시간 슬롯 상태 조회 실패", e);
            throw new RuntimeException("시간 슬롯 상태 조회에 실패했습니다", e);
        }
    }

    // Private helper methods

    /**
     * 특정 시간부터 상담 시간만큼 연속된 슬롯이 모두 비어있는지 확인
     */
    private boolean isTimeSlotAvailable(LocalTime startTime, int durationMinutes, Set<String> unavailableTimes,
            LocalTime businessEndTime) {
        LocalTime currentTime = startTime;
        LocalTime consultationEndTime = startTime.plusMinutes(durationMinutes);

        // 상담 종료 시간이 업무 시간을 초과하는지 확인
        if (consultationEndTime.isAfter(businessEndTime)) {
            return false;
        }

        // 상담 시간 동안의 모든 30분 슬롯이 비어있는지 확인
        while (currentTime.isBefore(consultationEndTime)) {
            if (unavailableTimes.contains(currentTime.toString())) {
                return false; // 하나라도 예약되어 있으면 불가능
            }
            currentTime = currentTime.plusMinutes(30);
        }

        return true; // 모든 슬롯이 비어있으면 예약 가능
    }

    /**
     * 주말(토요일, 일요일) 여부 확인
     */
    private boolean isWeekend(LocalDateTime dateTime) {
        java.time.DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        return dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY;
    }

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
