package com.hanazoom.domain.order.repository;

import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // 사용자의 주문 목록 조회 (최신순)
    Page<Order> findByMemberOrderByCreatedAtDesc(Member member, Pageable pageable);

    // 사용자의 특정 종목 주문 목록 조회
    Page<Order> findByMemberAndStockSymbolOrderByCreatedAtDesc(Member member, String stockSymbol, Pageable pageable);

    // 사용자의 특정 상태 주문 목록 조회
    Page<Order> findByMemberAndStatusOrderByCreatedAtDesc(Member member, Order.OrderStatus status, Pageable pageable);

    // 사용자의 미체결 주문 목록 조회 (PENDING, PARTIAL_FILLED)
    @Query("SELECT o FROM Order o WHERE o.member = :member AND o.status IN ('PENDING', 'PARTIAL_FILLED') ORDER BY o.createdAt DESC")
    List<Order> findPendingOrdersByMember(@Param("member") Member member);

    // 특정 종목의 미체결 주문 목록 조회
    @Query("SELECT o FROM Order o WHERE o.stock.symbol = :stockSymbol AND o.status IN ('PENDING', 'PARTIAL_FILLED') ORDER BY o.price ASC")
    List<Order> findPendingOrdersByStockSymbol(@Param("stockSymbol") String stockSymbol);

    // 사용자의 오늘 주문 목록 조회
    @Query("SELECT o FROM Order o WHERE o.member = :member AND DATE(o.createdAt) = DATE(:today) ORDER BY o.createdAt DESC")
    List<Order> findTodayOrdersByMember(@Param("member") Member member, @Param("today") LocalDateTime today);

    // 사용자의 주문 통계
    @Query("SELECT COUNT(o) FROM Order o WHERE o.member = :member AND o.status = :status")
    long countByMemberAndStatus(@Param("member") Member member, @Param("status") Order.OrderStatus status);

    // 사용자의 총 주문 금액 (체결된 주문만)
    @Query("SELECT SUM(o.filledAmount) FROM Order o WHERE o.member = :member AND o.status = 'FILLED'")
    Double getTotalFilledAmountByMember(@Param("member") Member member);
}

