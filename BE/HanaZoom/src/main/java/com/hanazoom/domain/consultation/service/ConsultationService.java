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

    @Transactional
    public ConsultationResponseDto createConsultation(ConsultationRequestDto requestDto, UUID clientId) {
        log.info("상담 예약 요청: clientId={}, pbId={}, type={}", clientId, requestDto.getPbId(),
                requestDto.getConsultationType());


        Member client = memberRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("고객 정보를 찾을 수 없습니다"));

        UUID pbId = UUID.fromString(requestDto.getPbId());


        Member pb = memberRepository.findById(pbId)
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다"));

        LocalDateTime scheduledAt = requestDto.getScheduledAt();


        if (isWeekend(scheduledAt)) {
            throw new IllegalStateException("주말(토요일, 일요일)에는 상담을 진행하지 않습니다. 평일을 선택해주세요.");
        }


        List<Consultation> existingConsultations = consultationRepository
                .findByPbIdAndScheduledAtBetween(pbId, scheduledAt,
                        scheduledAt.plusMinutes(requestDto.getDurationMinutes()));

        if (!existingConsultations.isEmpty()) {
            throw new IllegalStateException("선택한 시간이 더 이상 예약 가능하지 않습니다. 다른 시간을 선택해주세요.");
        }


        BigDecimal fee = requestDto.getFee() != null ? requestDto.getFee()
                : BigDecimal.valueOf(requestDto.getConsultationType().getDefaultFee());


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

    @Transactional
    public ConsultationResponseDto approveConsultation(ConsultationApprovalDto approvalDto, UUID pbId) {
        log.info("상담 승인/거절: pbId={}, consultationId={}, approved={}",
                pbId, approvalDto.getConsultationId(), approvalDto.isApproved());


        if (approvalDto.getConsultationId() == null || approvalDto.getConsultationId().trim().isEmpty()) {
            throw new IllegalArgumentException("상담 ID가 필요합니다");
        }

        Consultation consultation = consultationRepository.findById(UUID.fromString(approvalDto.getConsultationId()))
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));


        if (!consultation.getPb().getId().equals(pbId)) {
            throw new IllegalArgumentException("해당 상담을 처리할 권한이 없습니다");
        }


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

    @Transactional
    public ConsultationResponseDto startConsultation(UUID consultationId, UUID pbId) {
        log.info("상담 시작: consultationId={}, pbId={}", consultationId, pbId);

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));


        if (!consultation.getPb().getId().equals(pbId)) {
            throw new IllegalArgumentException("해당 상담을 시작할 권한이 없습니다");
        }


        log.info("상담 상태 확인: status={}, isApproved={}, isPending={}, isCancelled={}, isCompleted={}",
                consultation.getStatus(), consultation.isApproved(), consultation.isPending(),
                consultation.isCancelled(), consultation.isCompleted());

        if (!consultation.canBeStarted()) {
            throw new IllegalStateException("상담을 시작할 수 없는 상태입니다. 현재 상태: " + consultation.getStatus());
        }


        String meetingUrl = generateMeetingUrl(consultationId);
        String meetingId = consultationId.toString();

        consultation.start(meetingUrl, meetingId);
        log.info("상담 시작 완료: consultationId={}", consultationId);

        return convertToResponseDto(consultation);
    }

    @Transactional
    public ConsultationResponseDto endConsultation(UUID consultationId, UUID pbId, String consultationNotes) {
        log.info("상담 종료: consultationId={}, pbId={}", consultationId, pbId);

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));


        if (!consultation.getPb().getId().equals(pbId)) {
            throw new IllegalArgumentException("해당 상담을 종료할 권한이 없습니다");
        }


        if (!consultation.canBeEnded()) {
            throw new IllegalStateException("상담을 종료할 수 없는 상태입니다");
        }

        consultation.end(consultationNotes);


        consultation.getPb().incrementConsultationCount();
        memberRepository.save(consultation.getPb());

        log.info("상담 종료 완료: consultationId={}", consultationId);

        return convertToResponseDto(consultation);
    }

    @Transactional
    public ConsultationResponseDto cancelConsultation(UUID consultationId, UUID userId, String reason,
            boolean isClient) {
        log.info("상담 취소: consultationId={}, userId={}, isClient={}", consultationId, userId, isClient);

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));


        boolean hasPermission = isClient ? consultation.getClient().getId().equals(userId)
                : consultation.getPb().getId().equals(userId);

        if (!hasPermission) {
            throw new IllegalArgumentException("해당 상담을 취소할 권한이 없습니다");
        }


        if (!consultation.canBeCancelled()) {
            throw new IllegalStateException("상담을 취소할 수 없는 상태입니다");
        }

        CancelledBy cancelledBy = isClient ? CancelledBy.CLIENT : CancelledBy.PB;
        consultation.cancel(reason, cancelledBy);

        log.info("상담 취소 완료: consultationId={}", consultationId);

        return convertToResponseDto(consultation);
    }

    @Transactional
    public ConsultationResponseDto rateConsultation(ConsultationRatingDto ratingDto, UUID clientId) {
        log.info("상담 평가: consultationId={}, clientId={}, rating={}",
                ratingDto.getConsultationId(), clientId, ratingDto.getRating());

        Consultation consultation = consultationRepository.findById(UUID.fromString(ratingDto.getConsultationId()))
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));


        if (!consultation.getClient().getId().equals(clientId)) {
            throw new IllegalArgumentException("해당 상담을 평가할 권한이 없습니다");
        }


        if (!consultation.isCompleted()) {
            throw new IllegalStateException("완료된 상담만 평가할 수 있습니다");
        }

        consultation.rateByClient(ratingDto.getRating(), ratingDto.getFeedback());


        updatePbRating(consultation.getPb());

        log.info("상담 평가 완료: consultationId={}", consultation.getId());

        return convertToResponseDto(consultation);
    }

    public Page<ConsultationResponseDto> getConsultationsByClient(UUID clientId, Pageable pageable) {
        Page<Consultation> consultations = consultationRepository.findByClientId(clientId, pageable);
        return consultations.map(this::convertToResponseDto);
    }

    public Page<ConsultationResponseDto> getConsultationsByPb(UUID pbId, Pageable pageable) {
        Page<Consultation> consultations = consultationRepository.findByPbId(pbId, pageable);
        return consultations.map(this::convertToResponseDto);
    }

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

            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            consultations = consultationRepository.findByPbIdAndScheduledAtAfter(pbId, thirtyDaysAgo);
        }

        return consultations.stream()

                .filter(c -> c.isClientBooking())

                .filter(c -> c.getStatus() != ConsultationStatus.CANCELLED &&
                        c.getStatus() != ConsultationStatus.REJECTED)
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    public PbDashboardDto getPbDashboard(UUID pbId) {
        Member pb = memberRepository.findById(pbId)
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다"));

        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime tomorrow = today.plusDays(1);


        List<Consultation> todayConsultationsRaw = consultationRepository
                .findByPbIdAndScheduledAtBetween(pbId, today, tomorrow);
        List<Consultation> todayConsultations = todayConsultationsRaw.stream()
                .filter(c -> c.isClientBooking())

                .filter(c -> c.getStatus() != ConsultationStatus.CANCELLED &&
                        c.getStatus() != ConsultationStatus.REJECTED)
                .collect(Collectors.toList());


        List<Consultation> pendingConsultations = consultationRepository
                .findPendingConsultationsByPbId(pbId, ConsultationStatus.PENDING)
                .stream()
                .filter(c -> c.isClientBooking())
                .collect(Collectors.toList());


        List<Consultation> inProgressConsultations = consultationRepository
                .findInProgressConsultationsByPbId(pbId, ConsultationStatus.IN_PROGRESS)
                .stream()
                .filter(c -> c.isClientBooking())
                .collect(Collectors.toList());


        Page<Consultation> recentConsultations = consultationRepository
                .findRecentConsultationsByPbId(pbId, Pageable.ofSize(5));


        long totalCompleted = consultationRepository.countCompletedConsultationsByPbId(pbId,
                ConsultationStatus.COMPLETED);
        Double averageRating = consultationRepository.getAverageRatingByPbId(pbId);


        List<Object[]> typeStats = consultationRepository.getConsultationTypeStatistics(pbId,
                ConsultationStatus.COMPLETED);
        Map<String, Long> typeStatistics = typeStats.stream()
                .collect(Collectors.toMap(
                        stat -> ((ConsultationType) stat[0]).getDisplayName(),
                        stat -> (Long) stat[1]));


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

    public ConsultationResponseDto getConsultationById(UUID consultationId, UUID userId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new IllegalArgumentException("상담 정보를 찾을 수 없습니다"));


        boolean hasPermission = consultation.getClient().getId().equals(userId) ||
                consultation.getPb().getId().equals(userId);

        if (!hasPermission) {
            throw new IllegalArgumentException("해당 상담 정보를 조회할 권한이 없습니다");
        }

        return convertToResponseDto(consultation);
    }

    public List<ConsultationResponseDto> getConsultationsForRating(UUID clientId) {
        List<Consultation> consultations = consultationRepository.findCompletedConsultationsForRating(clientId,
                ConsultationStatus.COMPLETED);
        return consultations.stream().map(this::convertToResponseDto).toList();
    }

    public List<PbClientDto> getPbClients(UUID pbId) {
        log.info("PB 고객 목록 조회: pbId={}", pbId);

        try {

            List<Consultation> consultations = consultationRepository.findDistinctClientsByPbId(pbId,
                    ConsultationStatus.UNAVAILABLE);

            Map<UUID, PbClientDto> clientMap = new HashMap<>();

            for (Consultation consultation : consultations) {

                if (consultation.isPbOwnSchedule()) {
                    continue;
                }

                Member client = consultation.getClient();
                UUID clientId = client.getId();

                if (!clientMap.containsKey(clientId)) {

                    PbClientDto clientDto = PbClientDto.builder()
                            .id(clientId.toString())
                            .name(client.getName())
                            .email(client.getEmail())
                            .region(client.getAddress() != null ? client.getAddress() : "지역 정보 없음")
                            .totalConsultations(0)
                            .completedConsultations(0)
                            .averageRating(0.0)
                            .totalAssets(calculateTotalAssets(clientId)) 
                            .riskLevel(calculateRiskLevel(clientId)) 
                            .portfolioScore(calculatePortfolioScore(clientId)) 
                            .build();

                    clientMap.put(clientId, clientDto);
                }


                PbClientDto clientDto = clientMap.get(clientId);
                clientDto.incrementTotalConsultations();

                if (consultation.getStatus() == ConsultationStatus.COMPLETED) {
                    clientDto.incrementCompletedConsultations();
                    if (consultation.getClientRating() != null) {
                        clientDto.addRating(consultation.getClientRating());
                    }
                }

                LocalDateTime now = LocalDateTime.now();


                if (consultation.getStatus() == ConsultationStatus.COMPLETED &&
                        consultation.getScheduledAt().isBefore(now)) {
                    if (clientDto.getLastConsultation() == null ||
                            consultation.getScheduledAt()
                                    .isAfter(LocalDateTime.parse(clientDto.getLastConsultation()))) {
                        clientDto.setLastConsultation(consultation.getScheduledAt().toString());
                    }
                }


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


            AccountBalance balance = accountBalanceRepository
                    .findLatestBalanceByAccountIdOrderByDateDesc(mainAccount.getId())
                    .orElse(null);
            if (balance == null) {
                log.debug("고객 {}의 계좌 잔고 정보가 없습니다", clientId);
                return BigDecimal.ZERO;
            }


            BigDecimal totalStockValue = portfolioStockRepository.findTotalStockValueByAccountId(mainAccount.getId());


            BigDecimal totalCash = balance.getAvailableCash()
                    .add(balance.getSettlementCash())
                    .add(balance.getWithdrawableCash());


            return totalCash.add(totalStockValue != null ? totalStockValue : BigDecimal.ZERO);
        } catch (Exception e) {
            log.warn("총 자산 계산 실패: clientId={}", clientId, e);

            return BigDecimal.valueOf(50000000 + (clientId.hashCode() % 100000000));
        }
    }

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


            PortfolioStockRepository.UserPortfolioStats stats = portfolioStockRepository
                    .getUserPortfolioStats(mainAccount.getId());


            return calculateRiskLevelFromProfitRate(stats.getAvgProfitLossRate());
        } catch (Exception e) {
            log.warn("위험도 계산 실패: clientId={}", clientId, e);

            int hash = Math.abs(clientId.hashCode() % 3);
            return switch (hash) {
                case 0 -> "낮음";
                case 1 -> "보통";
                default -> "높음";
            };
        }
    }

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


            PortfolioStockRepository.UserPortfolioStats stats = portfolioStockRepository
                    .getUserPortfolioStats(mainAccount.getId());

            if (stats == null) {
                return 75;
            }


            int score = 50; 


            long stockCount = stats.getStockCount();
            if (stockCount >= 10) {
                score += 20; 
            } else if (stockCount >= 5) {
                score += 15; 
            } else if (stockCount >= 3) {
                score += 10; 
            } else if (stockCount >= 1) {
                score += 5; 
            }


            BigDecimal avgProfitRate = stats.getAvgProfitLossRate();
            if (avgProfitRate != null) {
                double rate = avgProfitRate.doubleValue();
                if (rate >= 20) {
                    score += 25; 
                } else if (rate >= 10) {
                    score += 20; 
                } else if (rate >= 5) {
                    score += 15; 
                } else if (rate >= 0) {
                    score += 10; 
                } else if (rate >= -10) {
                    score += 5; 
                }

            }


            BigDecimal totalValue = stats.getTotalValue();
            if (totalValue != null) {
                long value = totalValue.longValue();
                if (value >= 100000000) { 
                    score += 5;
                } else if (value >= 50000000) { 
                    score += 3;
                } else if (value >= 10000000) { 
                    score += 1;
                }
            }


            return Math.min(Math.max(score, 0), 100);
        } catch (Exception e) {
            log.warn("포트폴리오 점수 계산 실패: clientId={}", clientId, e);
            return 75;
        }
    }

    public List<RegionClientStatsDto> getPbRegionClientStats(UUID pbId) {
        log.info("PB 지역별 고객 현황 조회: pbId={}", pbId);

        try {

            List<Consultation> consultations = consultationRepository.findDistinctClientsByPbId(pbId,
                    ConsultationStatus.UNAVAILABLE);


            Map<String, RegionClientStatsDto> regionStatsMap = new HashMap<>();

            for (Consultation consultation : consultations) {

                if (consultation.isPbOwnSchedule()) {
                    continue;
                }

                Member client = consultation.getClient();
                String region = client.getAddress() != null ? client.getAddress() : "기타 지역";


                region = normalizeRegion(region);

                RegionClientStatsDto stats = regionStatsMap.computeIfAbsent(region, k -> RegionClientStatsDto.builder()
                        .regionName(k)
                        .clientCount(0)
                        .totalConsultations(0)
                        .completedConsultations(0)
                        .averageRating(0.0)
                        .build());


                stats.addClient(client.getId());
                stats.incrementTotalConsultations();

                if (consultation.getStatus() == ConsultationStatus.COMPLETED) {
                    stats.incrementCompletedConsultations();
                    if (consultation.getClientRating() != null) {
                        stats.addRating(consultation.getClientRating());
                    }
                }
            }


            regionStatsMap.values().forEach(RegionClientStatsDto::calculateFinalStats);

            return regionStatsMap.values().stream()
                    .sorted((a, b) -> Integer.compare(b.getClientCount(), a.getClientCount()))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("PB 지역별 고객 현황 조회 실패: pbId={}", pbId, e);
            throw new RuntimeException("지역별 고객 현황 조회에 실패했습니다", e);
        }
    }

    private String normalizeRegion(String address) {
        if (address == null || address.trim().isEmpty()) {
            return "기타 지역";
        }


        String[] parts = address.split(" ");
        if (parts.length >= 2) {
            String city = parts[0];
            String district = parts[1];


            if (city.contains("서울") || city.contains("부산") || city.contains("대구") ||
                    city.contains("인천") || city.contains("광주") || city.contains("대전") || city.contains("울산")) {
                return city + " " + district;
            }

            else if (city.contains("도")) {
                return district;
            }
        }

        return parts[0]; 
    }

    public PbTimeStatusDto getPbTimeStatus(UUID pbId, String date) {
        log.info("PB 시간 상태 조회: pbId={}, date={}", pbId, date);

        try {
            LocalDate targetDate = LocalDate.parse(date);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();


            if (isWeekend(startOfDay)) {
                log.info("주말({})이므로 시간 상태를 빈 상태로 반환합니다.", targetDate.getDayOfWeek());
                return PbTimeStatusDto.builder()
                        .unavailableTimes(List.of())
                        .clientBookings(List.of())
                        .build();
            }


            List<Consultation> allConsultations = consultationRepository
                    .findByPbIdAndScheduledAtBetween(pbId, startOfDay, endOfDay);


            List<String> unavailableTimes = allConsultations.stream()
                    .filter(c -> c.isPbOwnSchedule() || c.getStatus() == ConsultationStatus.UNAVAILABLE)
                    .map(c -> c.getScheduledAt().toLocalTime().toString())
                    .collect(Collectors.toList());


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

    public List<String> getAvailableTimes(String pbId, String date, Integer durationMinutes) {
        log.info("가능한 상담 시간 조회: pbId={}, date={}, durationMinutes={}", pbId, date, durationMinutes);

        try {

            Map<String, Boolean> timeSlotsStatus = getTimeSlotsWithStatus(pbId, date, durationMinutes);

            return timeSlotsStatus.entrySet().stream()
                    .filter(entry -> entry.getValue()) 
                    .map(entry -> entry.getKey())
                    .sorted()
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("가능한 상담 시간 조회 실패", e);
            throw new RuntimeException("가능한 상담 시간 조회에 실패했습니다", e);
        }
    }

    public Map<String, Boolean> getTimeSlotsWithStatus(String pbId, String date, Integer durationMinutes) {
        log.info("시간 슬롯 상태 조회: pbId={}, date={}, durationMinutes={}", pbId, date, durationMinutes);

        try {
            UUID pbUuid = UUID.fromString(pbId);
            LocalDate targetDate = LocalDate.parse(date);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();


            if (isWeekend(startOfDay)) {
                log.info("주말({})이므로 모든 시간 슬롯을 사용 불가로 처리합니다.", targetDate.getDayOfWeek());
                return new HashMap<>();
            }


            List<Consultation> allSlots = consultationRepository
                    .findByPbIdAndScheduledAtBetween(pbUuid, startOfDay, endOfDay);


            Set<String> unavailableTimes = allSlots.stream()
                    .map(consultation -> consultation.getScheduledAt().toLocalTime().toString())
                    .collect(Collectors.toSet());


            Map<String, Boolean> timeSlots = new HashMap<>();
            LocalTime startTime = LocalTime.of(9, 0); 
            LocalTime endTime = LocalTime.of(18, 0); 


            int consultationDurationMinutes = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : 60;

            LocalTime currentTime = startTime;
            while (!currentTime.isAfter(endTime)) {
                String timeString = currentTime.toString();


                boolean isAvailable = isTimeSlotAvailable(currentTime, consultationDurationMinutes, unavailableTimes,
                        endTime);

                timeSlots.put(timeString, isAvailable);
                currentTime = currentTime.plusMinutes(30); 
            }

            return timeSlots;

        } catch (Exception e) {
            log.error("시간 슬롯 상태 조회 실패", e);
            throw new RuntimeException("시간 슬롯 상태 조회에 실패했습니다", e);
        }
    }



    private boolean isTimeSlotAvailable(LocalTime startTime, int durationMinutes, Set<String> unavailableTimes,
            LocalTime businessEndTime) {
        LocalTime currentTime = startTime;
        LocalTime consultationEndTime = startTime.plusMinutes(durationMinutes);


        if (consultationEndTime.isAfter(businessEndTime)) {
            return false;
        }


        while (currentTime.isBefore(consultationEndTime)) {
            if (unavailableTimes.contains(currentTime.toString())) {
                return false; 
            }
            currentTime = currentTime.plusMinutes(30);
        }

        return true; 
    }

    private boolean isWeekend(LocalDateTime dateTime) {
        java.time.DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        return dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY;
    }

    private String generateMeetingUrl(UUID consultationId) {
        return "https://meet.hanazoom.com/" + consultationId.toString();
    }

    private void updatePbRating(Member pb) {
        Double averageRating = consultationRepository.getAverageRatingByPbId(pb.getId());
        if (averageRating != null) {

            pb.updatePbRating(averageRating);
            memberRepository.save(pb);
        } else {

            pb.updatePbRating(5.0);
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



    public ConsultationJoinResponse joinConsultation(UUID consultationId, String userId, String clientId) {
        log.info("WebSocket 상담 참여 처리: consultationId={}, userId={}, clientId={}", consultationId, userId, clientId);

        try {

            Map<String, Object> participant = new HashMap<>();
            participant.put("userId", userId);
            participant.put("clientId", clientId);
            participant.put("role", "participant");
            participant.put("joinedAt", System.currentTimeMillis());


            Map<String, Object> participants = new HashMap<>();
            participants.put(userId, participant);


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

    public void leaveConsultation(UUID consultationId, String userId) {
        log.info("WebSocket 상담 나가기 처리: consultationId={}, userId={}", consultationId, userId);

        try {


            log.info("WebSocket 상담 나가기 성공: consultationId={}, userId={}", consultationId, userId);

        } catch (Exception e) {
            log.error("WebSocket 상담 나가기 처리 중 오류: consultationId={}, userId={}", consultationId, userId, e);
        }
    }
}
