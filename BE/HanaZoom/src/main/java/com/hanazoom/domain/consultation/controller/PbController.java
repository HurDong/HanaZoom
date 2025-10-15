package com.hanazoom.domain.consultation.controller;

import com.hanazoom.domain.consultation.dto.PbListResponseDto;
import com.hanazoom.domain.consultation.service.PbService;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.pb.dto.SetAvailabilityRequestDto;
import com.hanazoom.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pb")
@RequiredArgsConstructor
@Slf4j
public class PbController {

    private final PbService pbService;

    @PostMapping("/availability")
    public ResponseEntity<ApiResponse<Void>> setAvailability(
            @Valid @RequestBody SetAvailabilityRequestDto requestDto) {

        UUID pbId = getCurrentUserId();
        log.info("PB 상담 가능 시간 설정 요청: pbId={}, request={}", pbId, requestDto);

        pbService.setAvailability(requestDto, pbId);

        return ResponseEntity.ok(ApiResponse.success(null, "상담 가능 시간이 성공적으로 등록되었습니다."));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<PbListResponseDto>>> getActivePbList(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String specialty,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("활성 PB 목록 조회: region={}, specialty={}", region, specialty);

        Page<PbListResponseDto> pbList = pbService.getActivePbList(region, specialty, pageable);

        return ResponseEntity.ok(ApiResponse.success(pbList, "활성 PB 목록을 조회했습니다"));
    }

    @GetMapping("/{pbId}")
    public ResponseEntity<ApiResponse<PbListResponseDto>> getPbDetail(@PathVariable String pbId) {
        log.info("PB 상세 정보 조회: pbId={}", pbId);

        PbListResponseDto pbDetail = pbService.getPbDetail(pbId);

        return ResponseEntity.ok(ApiResponse.success(pbDetail, "PB 상세 정보를 조회했습니다"));
    }

    @GetMapping("/by-region/{regionId}")
    public ResponseEntity<ApiResponse<List<PbListResponseDto>>> getPbListByRegion(@PathVariable Long regionId) {
        log.info("지역별 PB 목록 조회: regionId={}", regionId);

        List<PbListResponseDto> pbList = pbService.getPbListByRegion(regionId);

        return ResponseEntity.ok(ApiResponse.success(pbList, "지역별 PB 목록을 조회했습니다"));
    }

    @GetMapping("/by-specialty")
    public ResponseEntity<ApiResponse<List<PbListResponseDto>>> getPbListBySpecialty(
            @RequestParam String specialty) {
        log.info("전문 분야별 PB 목록 조회: specialty={}", specialty);

        List<PbListResponseDto> pbList = pbService.getPbListBySpecialty(specialty);

        return ResponseEntity.ok(ApiResponse.success(pbList, "전문 분야별 PB 목록을 조회했습니다"));
    }

    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<PbListResponseDto>>> getRecommendedPbList(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("추천 PB 목록 조회: limit={}", limit);

        List<PbListResponseDto> pbList = pbService.getRecommendedPbList(limit);

        return ResponseEntity.ok(ApiResponse.success(pbList, "추천 PB 목록을 조회했습니다"));
    }

    @DeleteMapping("/unavailable-time")
    public ResponseEntity<ApiResponse<Void>> removeUnavailableTime(
            @RequestParam String date,
            @RequestParam String time) {
        UUID pbId = getCurrentUserId();
        log.info("PB 불가능 시간 삭제 요청: pbId={}, date={}, time={}", pbId, date, time);

        pbService.removeUnavailableTime(pbId, date, time);

        return ResponseEntity.ok(ApiResponse.success(null, "불가능 시간이 삭제되었습니다"));
    }

    private UUID getCurrentUserId() {


        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof Member) {
            return ((Member) principal).getId();
        }

        if (principal instanceof UUID) {
            return (UUID) principal;
        } else if (principal instanceof String && ((String) principal).equals("anonymousUser")) {

            throw new IllegalStateException("인증된 사용자가 아닙니다.");
        }



        try {
            return UUID.fromString(principal.toString());
        } catch (IllegalArgumentException e) {

            log.warn("Principal을 UUID로 변환할 수 없습니다: {}", principal);
            throw new IllegalStateException("사용자 ID 형식이 올바르지 않습니다.");
        }
    }
}
