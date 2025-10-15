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


    private String stockSymbol;
    private String stockName;
    private Double priceChangePercent;
    private Long currentPrice;


    private Long postId;
    private Long commentId;
    private String mentionedBy;


    private String emoji;
    private String timeAgo;
}
