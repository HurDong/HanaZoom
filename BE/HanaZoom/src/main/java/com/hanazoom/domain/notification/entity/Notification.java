package com.hanazoom.domain.notification.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notifications_member_created", columnList = "member_id, created_at"),
    @Index(name = "idx_notifications_member_unread", columnList = "member_id, is_read, created_at"),
    @Index(name = "idx_notifications_created", columnList = "created_at"),
    @Index(name = "idx_notifications_stock_symbol", columnList = "stock_symbol"),
    @Index(name = "idx_notifications_post_id", columnList = "post_id"),
    @Index(name = "idx_notifications_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, columnDefinition = "BINARY(16)")
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "target_url")
    private String targetUrl;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;


    @Column(name = "stock_symbol")
    private String stockSymbol;

    @Column(name = "stock_name")
    private String stockName;

    @Column(name = "price_change_percent")
    private Double priceChangePercent;

    @Column(name = "current_price")
    private Long currentPrice;


    @Column(name = "post_id")
    private Long postId;

    @Column(name = "comment_id")
    private Long commentId;

    @Column(name = "mentioned_by")
    private String mentionedBy;

    public void markAsRead() {
        this.isRead = true;
    }
}
