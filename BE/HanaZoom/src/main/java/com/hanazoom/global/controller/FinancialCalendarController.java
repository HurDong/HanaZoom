package com.hanazoom.global.controller;

import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.global.dto.FinancialCalendarDto;
import com.hanazoom.global.service.FinancialCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class FinancialCalendarController {

    private final FinancialCalendarService financialCalendarService;

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<FinancialCalendarDto>> getWeeklyFinancialCalendar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate,
            @RequestParam(defaultValue = "false") boolean includeAll) {

        try {
            log.info("주간 금융 캘린더 조회 요청 - baseDate: {}, includeAll: {}",
                    baseDate != null ? baseDate : "현재일", includeAll);

            FinancialCalendarDto calendar = financialCalendarService.getWeeklyCalendar(baseDate, includeAll);

            log.info("주간 금융 캘린더 조회 성공 - {}개 지표 반환", calendar.getItems().length);
            return ResponseEntity.ok(ApiResponse.success(calendar, "주간 금융 캘린더 조회 성공"));

        } catch (Exception e) {
            log.error("주간 금융 캘린더 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("주간 금융 캘린더 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}

