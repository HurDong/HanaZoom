package com.hanazoom.domain.consultation.controller;

import com.hanazoom.domain.consultation.dto.PbListResponseDto;
import com.hanazoom.domain.consultation.service.PbService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pb")
@RequiredArgsConstructor
@Slf4j
public class PbController {

    private final PbService pbService;

    /**
     * 활성 PB 목록 조회
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<PbListResponseDto>>> getActivePbList(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String specialty,
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.info("활성 PB 목록 조회: region={}, specialty={}", region, specialty);

        Page<PbListResponseDto> pbList = pbService.getActivePbList(region, specialty, pageable);
        
        return ResponseEntity.ok(ApiResponse.success(pbList, "활성 PB 목록을 조회했습니다"));
    }

    /**
     * PB 상세 정보 조회
     */
    @GetMapping("/{pbId}")
    public ResponseEntity<ApiResponse<PbListResponseDto>> getPbDetail(@PathVariable String pbId) {
        log.info("PB 상세 정보 조회: pbId={}", pbId);

        PbListResponseDto pbDetail = pbService.getPbDetail(pbId);
        
        return ResponseEntity.ok(ApiResponse.success(pbDetail, "PB 상세 정보를 조회했습니다"));
    }

    /**
     * 지역별 PB 목록 조회
     */
    @GetMapping("/by-region/{regionId}")
    public ResponseEntity<ApiResponse<List<PbListResponseDto>>> getPbListByRegion(@PathVariable Long regionId) {
        log.info("지역별 PB 목록 조회: regionId={}", regionId);

        List<PbListResponseDto> pbList = pbService.getPbListByRegion(regionId);
        
        return ResponseEntity.ok(ApiResponse.success(pbList, "지역별 PB 목록을 조회했습니다"));
    }

    /**
     * 전문 분야별 PB 목록 조회
     */
    @GetMapping("/by-specialty")
    public ResponseEntity<ApiResponse<List<PbListResponseDto>>> getPbListBySpecialty(
            @RequestParam String specialty) {
        log.info("전문 분야별 PB 목록 조회: specialty={}", specialty);

        List<PbListResponseDto> pbList = pbService.getPbListBySpecialty(specialty);
        
        return ResponseEntity.ok(ApiResponse.success(pbList, "전문 분야별 PB 목록을 조회했습니다"));
    }

    /**
     * 추천 PB 목록 조회 (평점 높은 순)
     */
    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<PbListResponseDto>>> getRecommendedPbList(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("추천 PB 목록 조회: limit={}", limit);

        List<PbListResponseDto> pbList = pbService.getRecommendedPbList(limit);
        
        return ResponseEntity.ok(ApiResponse.success(pbList, "추천 PB 목록을 조회했습니다"));
    }
}
