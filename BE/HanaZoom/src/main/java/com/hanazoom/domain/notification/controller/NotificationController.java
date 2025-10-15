package com.hanazoom.domain.notification.controller;

import com.hanazoom.domain.notification.dto.NotificationDto;
import com.hanazoom.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;


    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getUserNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {

        UUID memberId = UUID.fromString("e2fb8dd0-70e7-4549-9bab-eeafcbe70f56");

        Page<NotificationDto> notifications = notificationService.getUserNotifications(memberId, pageable);
        return ResponseEntity.ok(notifications);
    }


    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID memberId = UUID.fromString("e2fb8dd0-70e7-4549-9bab-eeafcbe70f56");

        long unreadCount = notificationService.getUnreadCount(memberId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", unreadCount);

        return ResponseEntity.ok(response);
    }


    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID memberId = UUID.fromString("e2fb8dd0-70e7-4549-9bab-eeafcbe70f56");

        notificationService.markAsRead(notificationId, memberId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "알림을 읽음 처리했습니다");

        return ResponseEntity.ok(response);
    }


    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID memberId = UUID.fromString("e2fb8dd0-70e7-4549-9bab-eeafcbe70f56");

        notificationService.markAllAsRead(memberId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "모든 알림을 읽음 처리했습니다");

        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID memberId = UUID.fromString("e2fb8dd0-70e7-4549-9bab-eeafcbe70f56");

        notificationService.deleteNotification(notificationId, memberId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "알림을 삭제했습니다");

        return ResponseEntity.ok(response);
    }


    @PostMapping("/test/create")
    public ResponseEntity<Map<String, Object>> createTestNotification() {
        try {
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

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "테스트 알림 생성 실패: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }
}
