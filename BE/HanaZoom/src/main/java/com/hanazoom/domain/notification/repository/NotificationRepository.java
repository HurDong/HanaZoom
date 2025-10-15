package com.hanazoom.domain.notification.repository;

import com.hanazoom.domain.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.QueryHint;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {


    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    Page<Notification> findByMemberIdOrderByCreatedAtDesc(UUID memberId, Pageable pageable);


    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.member.id = :memberId AND n.isRead = false")
    long countUnreadByMemberId(@Param("memberId") UUID memberId);


    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "100"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    List<Notification> findByMemberIdAndIsReadFalseOrderByCreatedAtDesc(UUID memberId);


    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "20"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    @Query("SELECT n FROM Notification n WHERE n.member.id = :memberId AND n.stockSymbol = :stockSymbol AND n.type IN ('STOCK_PRICE_UP_5', 'STOCK_PRICE_UP_10', 'STOCK_PRICE_DOWN_5', 'STOCK_PRICE_DOWN_10') AND n.createdAt >= :since")
    List<Notification> findRecentPriceNotifications(@Param("memberId") UUID memberId,
            @Param("stockSymbol") String stockSymbol, @Param("since") java.time.LocalDateTime since);


    @QueryHints(value = {
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "20"),
        @QueryHint(name = "org.hibernate.cacheable", value = "false")
    })
    @Query("SELECT n FROM Notification n WHERE n.member.id = :memberId AND n.postId = :postId AND n.type IN ('NEW_COMMENT', 'NEW_LIKE') AND n.createdAt >= :since")
    List<Notification> findRecentCommunityNotifications(@Param("memberId") UUID memberId, @Param("postId") Long postId,
            @Param("since") java.time.LocalDateTime since);
}
