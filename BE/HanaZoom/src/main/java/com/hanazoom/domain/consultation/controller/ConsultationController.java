package com.hanazoom.domain.consultation.controller;

import com.hanazoom.domain.consultation.dto.*;
import com.hanazoom.domain.consultation.service.ConsultationService;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
@Slf4j
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> createConsultation(
            @Valid @RequestBody ConsultationRequestDto requestDto) {

        UUID clientId = getCurrentUserId();
        log.info("상담 예약 요청: clientId={}, request={}", clientId, requestDto);

        ConsultationResponseDto response = consultationService.createConsultation(requestDto, clientId);

        return ResponseEntity.ok(ApiResponse.success(response, "상담 예약이 요청되었습니다"));
    }

    @PostMapping("/{consultationId}/approve")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> approveConsultation(
            @PathVariable String consultationId,
            @RequestBody ConsultationApprovalDto approvalDto) {

        UUID pbId = getCurrentUserId();
        approvalDto.setConsultationId(consultationId);


        if (approvalDto.getPbMessage() == null || approvalDto.getPbMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("PB 메시지는 필수입니다");
        }

        log.info("상담 승인/거절: pbId={}, consultationId={}, approved={}",
                pbId, consultationId, approvalDto.isApproved());

        ConsultationResponseDto response = consultationService.approveConsultation(approvalDto, pbId);

        String message = approvalDto.isApproved() ? "상담이 승인되었습니다" : "상담이 거절되었습니다";
        return ResponseEntity.ok(ApiResponse.success(response, message));
    }

    @PostMapping("/{consultationId}/start")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> startConsultation(
            @PathVariable String consultationId) {

        UUID pbId = getCurrentUserId();
        log.info("상담 시작 요청: pbId={}, consultationId={}", pbId, consultationId);

        try {

            var consultation = consultationService.getConsultationById(
                    UUID.fromString(consultationId), pbId);
            log.info("상담 정보 조회 성공: consultationId={}, pbId={}, clientId={}",
                    consultationId, consultation.getPbId(), consultation.getClientId());

            ConsultationResponseDto response = consultationService.startConsultation(
                    UUID.fromString(consultationId), pbId);

            return ResponseEntity.ok(ApiResponse.success(response, "상담이 시작되었습니다"));
        } catch (IllegalArgumentException e) {
            log.error("상담 시작 실패 - 권한 없음: pbId={}, consultationId={}, error={}",
                    pbId, consultationId, e.getMessage());
            return ResponseEntity.status(403).body(
                    ApiResponse.error("해당 상담을 시작할 권한이 없습니다: " + e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("상담 시작 실패 - 상태 오류: pbId={}, consultationId={}, error={}",
                    pbId, consultationId, e.getMessage());
            return ResponseEntity.status(400).body(
                    ApiResponse.error("상담을 시작할 수 없습니다: " + e.getMessage()));
        } catch (Exception e) {
            log.error("상담 시작 실패: pbId={}, consultationId={}, error={}",
                    pbId, consultationId, e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("상담 시작에 실패했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/{consultationId}/end")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> endConsultation(
            @PathVariable String consultationId,
            @RequestBody(required = false) String consultationNotes) {

        UUID pbId = getCurrentUserId();
        log.info("상담 종료: pbId={}, consultationId={}", pbId, consultationId);

        ConsultationResponseDto response = consultationService.endConsultation(
                UUID.fromString(consultationId), pbId, consultationNotes);

        return ResponseEntity.ok(ApiResponse.success(response, "상담이 종료되었습니다"));
    }

    @PostMapping("/{consultationId}/cancel")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> cancelConsultation(
            @PathVariable String consultationId,
            @RequestBody CancelRequestDto cancelRequest) {

        UUID userId = getCurrentUserId();
        log.info("상담 취소: userId={}, consultationId={}", userId, consultationId);


        boolean isClient = true; 

        ConsultationResponseDto response = consultationService.cancelConsultation(
                UUID.fromString(consultationId), userId, cancelRequest.getReason(), isClient);

        return ResponseEntity.ok(ApiResponse.success(response, "상담이 취소되었습니다"));
    }

    @PostMapping("/{consultationId}/rate")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> rateConsultation(
            @PathVariable String consultationId,
            @Valid @RequestBody ConsultationRatingDto ratingDto) {

        UUID clientId = getCurrentUserId();
        ratingDto.setConsultationId(consultationId);

        log.info("상담 평가: clientId={}, consultationId={}, rating={}",
                clientId, consultationId, ratingDto.getRating());

        ConsultationResponseDto response = consultationService.rateConsultation(ratingDto, clientId);

        return ResponseEntity.ok(ApiResponse.success(response, "상담 평가가 완료되었습니다"));
    }

    @GetMapping("/my-consultations")
    public ResponseEntity<ApiResponse<Page<ConsultationResponseDto>>> getMyConsultations(
            @PageableDefault(size = 10) Pageable pageable) {

        UUID clientId = getCurrentUserId();
        log.info("고객 상담 목록 조회: clientId={}", clientId);

        Page<ConsultationResponseDto> consultations = consultationService.getConsultationsByClient(clientId, pageable);

        return ResponseEntity.ok(ApiResponse.success(consultations, "상담 목록을 조회했습니다"));
    }

    @GetMapping("/pb-consultations")
    public ResponseEntity<ApiResponse<Page<ConsultationResponseDto>>> getPbConsultations(
            @PageableDefault(size = 10) Pageable pageable) {

        UUID pbId = getCurrentUserId();
        log.info("PB 상담 목록 조회: pbId={}", pbId);

        Page<ConsultationResponseDto> consultations = consultationService.getConsultationsByPb(pbId, pageable);

        return ResponseEntity.ok(ApiResponse.success(consultations, "PB 상담 목록을 조회했습니다"));
    }

    @GetMapping("/pb-calendar")
    public ResponseEntity<ApiResponse<List<ConsultationResponseDto>>> getPbCalendarConsultations(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        UUID pbId = getCurrentUserId();
        log.info("PB 캘린더 상담 목록 조회: pbId={}, startDate={}, endDate={}", pbId, startDate, endDate);

        List<ConsultationResponseDto> consultations = consultationService.getPbCalendarConsultations(pbId, startDate,
                endDate);

        return ResponseEntity.ok(ApiResponse.success(consultations, "PB 캘린더 상담 목록을 조회했습니다"));
    }

    @GetMapping("/pb-dashboard")
    public ResponseEntity<ApiResponse<PbDashboardDto>> getPbDashboard() {
        UUID pbId = getCurrentUserId();

        PbDashboardDto dashboard = consultationService.getPbDashboard(pbId);

        return ResponseEntity.ok(ApiResponse.success(dashboard, "PB 대시보드 정보를 조회했습니다"));
    }

    @GetMapping("/{consultationId}")
    public ResponseEntity<ApiResponse<ConsultationResponseDto>> getConsultation(
            @PathVariable String consultationId) {

        UUID userId = getCurrentUserId();
        log.info("상담 상세 조회: userId={}, consultationId={}", userId, consultationId);

        ConsultationResponseDto consultation = consultationService.getConsultationById(
                UUID.fromString(consultationId), userId);

        return ResponseEntity.ok(ApiResponse.success(consultation, "상담 정보를 조회했습니다"));
    }

    @GetMapping("/for-rating")
    public ResponseEntity<ApiResponse<List<ConsultationResponseDto>>> getConsultationsForRating() {
        UUID clientId = getCurrentUserId();
        log.info("평가 가능한 상담 목록 조회: clientId={}", clientId);

        List<ConsultationResponseDto> consultations = consultationService.getConsultationsForRating(clientId);

        return ResponseEntity.ok(ApiResponse.success(consultations, "평가 가능한 상담 목록을 조회했습니다"));
    }

    @GetMapping("/available-times")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableTimes(
            @RequestParam String pbId,
            @RequestParam String date,
            @RequestParam(defaultValue = "60") Integer durationMinutes) {

        log.info("가능한 상담 시간 조회: pbId={}, date={}, durationMinutes={}", pbId, date, durationMinutes);

        try {
            List<String> availableTimes = consultationService.getAvailableTimes(pbId, date, durationMinutes);
            return ResponseEntity.ok(ApiResponse.success(availableTimes, "가능한 상담 시간을 조회했습니다"));
        } catch (Exception e) {
            log.error("가능한 상담 시간 조회 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("가능한 상담 시간 조회에 실패했습니다"));
        }
    }

    @GetMapping("/time-slots")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getTimeSlotsWithStatus(
            @RequestParam String pbId,
            @RequestParam String date,
            @RequestParam(defaultValue = "60") Integer durationMinutes) {

        log.info("시간 슬롯 상태 조회: pbId={}, date={}", pbId, date);

        try {
            Map<String, Boolean> timeSlotsStatus = consultationService.getTimeSlotsWithStatus(pbId, date,
                    durationMinutes);
            return ResponseEntity.ok(ApiResponse.success(timeSlotsStatus, "시간 슬롯 상태를 조회했습니다"));
        } catch (Exception e) {
            log.error("시간 슬롯 상태 조회 실패", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("시간 슬롯 상태 조회에 실패했습니다"));
        }
    }

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<ConsultationTypeDto>>> getConsultationTypes() {
        log.info("상담 유형 목록 조회");

        List<ConsultationTypeDto> types = List.of(
                ConsultationTypeDto.builder()
                        .type("PORTFOLIO_ANALYSIS")
                        .displayName("포트폴리오 분석")
                        .defaultFee(100000)
                        .defaultDurationMinutes(60)
                        .description("현재 보유 종목 분석 및 포트폴리오 최적화 상담")
                        .build(),
                ConsultationTypeDto.builder()
                        .type("STOCK_CONSULTATION")
                        .displayName("종목 상담")
                        .defaultFee(30000)
                        .defaultDurationMinutes(30)
                        .description("개별 종목 분석 및 매매 조언")
                        .build(),
                ConsultationTypeDto.builder()
                        .type("PRODUCT_CONSULTATION")
                        .displayName("상품 상담")
                        .defaultFee(50000)
                        .defaultDurationMinutes(45)
                        .description("예금, 펀드, 대출 등 하나은행 상품 상담")
                        .build(),
                ConsultationTypeDto.builder()
                        .type("GENERAL_CONSULTATION")
                        .displayName("일반 상담")
                        .defaultFee(50000)
                        .defaultDurationMinutes(60)
                        .description("투자 전반에 대한 일반적인 상담")
                        .build(),
                ConsultationTypeDto.builder()
                        .type("INSURANCE_CONSULTATION")
                        .displayName("보험 상담")
                        .defaultFee(50000)
                        .defaultDurationMinutes(45)
                        .description("생명보험, 손해보험 상품 상담")
                        .build(),
                ConsultationTypeDto.builder()
                        .type("TAX_CONSULTATION")
                        .displayName("세금 상담")
                        .defaultFee(50000)
                        .defaultDurationMinutes(30)
                        .description("투자 관련 세금 계산 및 신고 안내")
                        .build());

        return ResponseEntity.ok(ApiResponse.success(types, "상담 유형 목록을 조회했습니다"));
    }

    @GetMapping("/pb-clients")
    public ResponseEntity<ApiResponse<List<PbClientDto>>> getPbClients() {
        UUID pbId = getCurrentUserId();
        log.info("PB 고객 목록 조회 요청: pbId={}", pbId);

        List<PbClientDto> clients = consultationService.getPbClients(pbId);

        return ResponseEntity.ok(ApiResponse.success(clients, "고객 목록을 조회했습니다"));
    }

    @GetMapping("/pb-time-status")
    public ResponseEntity<ApiResponse<PbTimeStatusDto>> getPbTimeStatus(
            @RequestParam String date) {
        UUID pbId = getCurrentUserId();
        log.info("PB 시간 상태 조회 요청: pbId={}, date={}", pbId, date);

        PbTimeStatusDto timeStatus = consultationService.getPbTimeStatus(pbId, date);

        return ResponseEntity.ok(ApiResponse.success(timeStatus, "시간 상태를 조회했습니다"));
    }

    @GetMapping("/pb-region-stats")
    public ResponseEntity<ApiResponse<List<RegionClientStatsDto>>> getPbRegionStats() {
        UUID pbId = getCurrentUserId();
        log.info("PB 지역별 고객 현황 조회 요청: pbId={}", pbId);

        List<RegionClientStatsDto> regionStats = consultationService.getPbRegionClientStats(pbId);

        return ResponseEntity.ok(ApiResponse.success(regionStats, "지역별 고객 현황을 조회했습니다"));
    }


    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null) {
            if (authentication.getPrincipal() instanceof Member) {
                Member member = (Member) authentication.getPrincipal();
                return member.getId();
            } else {
                log.error("인증 주체가 Member 타입이 아님: {}", authentication.getPrincipal());
            }
        } else {
            log.error("SecurityContext에서 인증 정보를 찾을 수 없음");
        }

        throw new IllegalStateException("인증된 사용자 정보를 찾을 수 없습니다");
    }


    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CancelRequestDto {
        private String reason;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ConsultationTypeDto {
        private String type;
        private String displayName;
        private int defaultFee;
        private int defaultDurationMinutes;
        private String description;
    }
}
