package com.hanazoom.domain.notification.dto;

import com.hanazoom.domain.notification.entity.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private NotificationType type;
    private String title;
    private String content;
    private String targetUrl;
    private boolean isRead;
    private LocalDateTime createdAt;

    // 가격 변동 알림용 필드
    private String stockSymbol;
    private String stockName;
    private Double priceChangePercent;
    private Long currentPrice;

    // 커뮤니티 알림용 필드
    private Long postId;
    private Long commentId;
    private String mentionedBy;

    // UI 표시용
    private String emoji;
    private String timeAgo;
}
