package com.hanazoom.global.controller;

import com.hanazoom.global.dto.ApiResponse;
import com.hanazoom.global.service.EcosApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/ecos")
@RequiredArgsConstructor
public class EcosController {

    private final EcosApiService ecosApiService;

    @GetMapping("/weekly-schedule")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWeeklyFinancialCalendar() {
        try {
            log.info("주간 금융 캘린더 조회 요청");

            ResponseEntity<Map<String, Object>> response = ecosApiService.getWeeklyFinancialCalendar();

            log.info("서비스 응답 상태: {}", response.getStatusCode());
            log.info("서비스 응답 본문: {}", response.getBody());

            if (response.getBody() != null && (Boolean) response.getBody().get("success")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
                String message = (String) response.getBody().get("message");
                return ResponseEntity.ok(ApiResponse.success(data, message));
            } else {
                String message = response.getBody() != null ? (String) response.getBody().get("message")
                        : "주간 금융 캘린더 조회에 실패했습니다.";
                log.error("서비스 응답 실패: {}", message);
                return ResponseEntity.badRequest().body(ApiResponse.error(message));
            }

        } catch (Exception e) {
            log.error("주간 금융 캘린더 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("주간 금융 캘린더 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}
