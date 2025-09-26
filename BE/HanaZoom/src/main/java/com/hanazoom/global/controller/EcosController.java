package com.hanazoom.global.controller;

import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.global.dto.FinancialScheduleItem;
import com.hanazoom.global.service.EcosApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * 한국은행 ECOS API 컨트롤러 (디버깅용)
 * 실제 경제지표 데이터를 제공하는 REST API 엔드포인트
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ecos")
@RequiredArgsConstructor
public class EcosController {

    private final EcosApiService ecosApiService;

    /**
     * 금주 금융 캘린더 조회
     * GET /api/v1/ecos/weekly-schedule
     */
    @GetMapping("/weekly-schedule")
    public ResponseEntity<ApiResponse<List<FinancialScheduleItem>>> getWeeklyFinancialCalendar() {
        try {
            log.info("주간 금융 캘린더 조회 요청");

            // 실제 한국은행 API 호출 시도
            List<FinancialScheduleItem> scheduleItems = ecosApiService.getWeeklySchedule();

            log.info("서비스에서 조회된 데이터 개수: {}", scheduleItems.size());

            // 데이터가 있으면 성공 응답, 없으면 빈 리스트와 메시지 반환
            if (!scheduleItems.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(scheduleItems, "금주 금융 캘린더를 조회했습니다."));
            } else {
                log.warn("조회된 데이터가 없음 - 빈 데이터 반환");
                return ResponseEntity.ok(ApiResponse.success(new ArrayList<>(), "금주 금융 일정이 없습니다."));
            }

        } catch (Exception e) {
            log.error("주간 금융 캘린더 조회 중 오류 발생", e);

            // 예외 발생 시 빈 데이터 반환
            return ResponseEntity.ok(ApiResponse.success(new ArrayList<>(),
                    "금주 금융 캘린더 조회 중 오류가 발생했습니다."));
        }
    }

}
