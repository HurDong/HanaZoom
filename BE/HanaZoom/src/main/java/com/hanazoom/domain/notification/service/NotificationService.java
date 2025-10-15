package com.hanazoom.domain.notification.service;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.notification.dto.CreateNotificationRequest;
import com.hanazoom.domain.notification.dto.NotificationDto;
import com.hanazoom.domain.notification.entity.Notification;
import com.hanazoom.domain.notification.entity.NotificationType;
import com.hanazoom.domain.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;


    public Notification createNotification(CreateNotificationRequest request) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + request.getMemberId()));

        Notification notification = Notification.builder()
                .member(member)
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .targetUrl(request.getTargetUrl())
                .stockSymbol(request.getStockSymbol())
                .stockName(request.getStockName())
                .priceChangePercent(request.getPriceChangePercent())
                .currentPrice(request.getCurrentPrice())
                .postId(request.getPostId())
                .commentId(request.getCommentId())
                .mentionedBy(request.getMentionedBy())
                .build();

        return notificationRepository.save(notification);
    }


    public void createPriceChangeNotification(UUID memberId, String stockSymbol, String stockName,
            Double priceChangePercent, Long currentPrice) {


        LocalDateTime oneHourAgo = LocalDateTime.now().minus(1, ChronoUnit.HOURS);
        List<Notification> recentNotifications = notificationRepository.findRecentPriceNotifications(
                memberId, stockSymbol, oneHourAgo);

        if (!recentNotifications.isEmpty()) {
            log.info("최근 1시간 내에 이미 가격 변동 알림이 생성됨: {}", stockSymbol);
            return;
        }


        NotificationType notificationType = null;
        String title = "";
        String content = "";

        if (priceChangePercent >= 10.0) {
            notificationType = NotificationType.STOCK_PRICE_UP_10;
            title = "🚀 급등주 알림";
            content = String.format("%s이(가) %.1f%% 상승했습니다!", stockName, priceChangePercent);
        } else if (priceChangePercent >= 5.0) {
            notificationType = NotificationType.STOCK_PRICE_UP_5;
            title = "📈 상승 알림";
            content = String.format("%s이(가) %.1f%% 상승했습니다", stockName, priceChangePercent);
        } else if (priceChangePercent <= -10.0) {
            notificationType = NotificationType.STOCK_PRICE_DOWN_10;
            title = "💥 급락주 알림";
            content = String.format("%s이(가) %.1f%% 하락했습니다!", stockName, Math.abs(priceChangePercent));
        } else if (priceChangePercent <= -5.0) {
            notificationType = NotificationType.STOCK_PRICE_DOWN_5;
            title = "📉 하락 알림";
            content = String.format("%s이(가) %.1f%% 하락했습니다", stockName, Math.abs(priceChangePercent));
        }

        if (notificationType != null) {
            CreateNotificationRequest request = CreateNotificationRequest.builder()
                    .memberId(memberId)
                    .type(notificationType)
                    .title(title)
                    .content(content)
                    .targetUrl("/stocks/" + stockSymbol)
                    .stockSymbol(stockSymbol)
                    .stockName(stockName)
                    .priceChangePercent(priceChangePercent)
                    .currentPrice(currentPrice)
                    .build();

            createNotification(request);
            log.info("가격 변동 알림 생성: {} - {}", stockSymbol, title);
        }
    }


    public void createCommunityNotification(UUID memberId, NotificationType type, String title,
            String content, String targetUrl, Long postId,
            Long commentId, String mentionedBy) {


        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minus(1, ChronoUnit.MINUTES);
        List<Notification> recentNotifications = notificationRepository.findRecentCommunityNotifications(
                memberId, postId, thirtyMinutesAgo);

        if (!recentNotifications.isEmpty()) {
            log.info("최근 30분 내에 이미 커뮤니티 알림이 생성됨: postId={}", postId);
            return;
        }

        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .memberId(memberId)
                .type(type)
                .title(title)
                .content(content)
                .targetUrl(targetUrl)
                .postId(postId)
                .commentId(commentId)
                .mentionedBy(mentionedBy)
                .build();

        createNotification(request);
        log.info("커뮤니티 알림 생성: {} - {}", type, title);
    }


    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID memberId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId,
                pageable);

        return notifications.map(this::convertToDto);
    }


    @Transactional(readOnly = true)
    public long getUnreadCount(UUID memberId) {
        return notificationRepository.countUnreadByMemberId(memberId);
    }


    public void markAsRead(Long notificationId, UUID memberId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다: " + notificationId));

        if (!notification.getMember().getId().equals(memberId)) {
            throw new IllegalArgumentException("해당 알림에 대한 권한이 없습니다");
        }

        notification.markAsRead();
        notificationRepository.save(notification);
    }


    public void markAllAsRead(UUID memberId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByMemberIdAndIsReadFalseOrderByCreatedAtDesc(memberId);


        unreadNotifications.forEach(Notification::markAsRead);


        notificationRepository.saveAll(unreadNotifications);
    }


    public void deleteNotification(Long notificationId, UUID memberId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다: " + notificationId));

        if (!notification.getMember().getId().equals(memberId)) {
            throw new IllegalArgumentException("해당 알림에 대한 권한이 없습니다");
        }

        notificationRepository.save(notification);
    }


    private NotificationDto convertToDto(Notification notification) {
        String timeAgo = getTimeAgo(notification.getCreatedAt());

        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .targetUrl(notification.getTargetUrl())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .stockSymbol(notification.getStockSymbol())
                .stockName(notification.getStockName())
                .priceChangePercent(notification.getPriceChangePercent())
                .currentPrice(notification.getCurrentPrice())
                .postId(notification.getPostId())
                .commentId(notification.getCommentId())
                .mentionedBy(notification.getMentionedBy())
                .emoji(notification.getType().getEmoji())
                .timeAgo(timeAgo)
                .build();
    }


    private String getTimeAgo(LocalDateTime createdAt) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(createdAt, now);
        long hours = ChronoUnit.HOURS.between(createdAt, now);
        long days = ChronoUnit.DAYS.between(createdAt, now);

        if (minutes < 1)
            return "방금 전";
        if (minutes < 60)
            return minutes + "분 전";
        if (hours < 24)
            return hours + "시간 전";
        if (days < 7)
            return days + "일 전";
        return createdAt.format(java.time.format.DateTimeFormatter.ofPattern("MM/dd"));
    }
}
