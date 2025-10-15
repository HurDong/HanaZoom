package com.hanazoom.domain.notification.controller;

import com.hanazoom.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/test")
@RequiredArgsConstructor
@Slf4j
public class TestNotificationController {

    private final NotificationService notificationService;


    @PostMapping("/notification")
    public ResponseEntity<Map<String, Object>> createTestNotification() {
        try {
            log.info("테스트 알림 생성 시작");

            UUID testMemberId = UUID.fromString("e2fb8dd0-70e7-4549-9bab-eeafcbe70f56");


            notificationService.createPriceChangeNotification(
                    testMemberId,
                    "005930",
                    "삼성전자",
                    8.5,
                    85000L);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "테스트 알림이 생성되었습니다");
            response.put("memberId", testMemberId.toString());

            log.info("테스트 알림 생성 완료: {}", response);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("테스트 알림 생성 실패", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "테스트 알림 생성 실패: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());

            return ResponseEntity.badRequest().body(response);
        }
    }


    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "Notification Service");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}
