package com.hanazoom.domain.notification.dto;

import com.hanazoom.domain.notification.entity.NotificationType;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNotificationRequest {
    private UUID memberId;
    private NotificationType type;
    private String title;
    private String content;
    private String targetUrl;


    private String stockSymbol;
    private String stockName;
    private Double priceChangePercent;
    private Long currentPrice;


    private Long postId;
    private Long commentId;
    private String mentionedBy;
}
