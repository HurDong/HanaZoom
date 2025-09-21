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
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * 회원과 주문 ID로 주문 조회
     */
    Optional<Order> findByIdAndMember(Long orderId, Member member);
    
    /**
     * 회원의 주문 목록 조회 (생성일 기준 내림차순)
     */
    Page<Order> findByMemberOrderByCreatedAtDesc(Member member, Pageable pageable);
    
    /**
     * 회원과 종목코드로 주문 목록 조회 (생성일 기준 내림차순)
     */
    @Query("SELECT o FROM Order o WHERE o.member = :member AND o.stock.symbol = :stockSymbol ORDER BY o.createdAt DESC")
    Page<Order> findByMemberAndStockSymbolOrderByCreatedAtDesc(@Param("member") Member member, @Param("stockSymbol") String stockSymbol, Pageable pageable);
    
    /**
     * 회원의 미체결 주문 목록 조회 (생성일 기준 내림차순)
     */
    List<Order> findByMemberAndStatusOrderByCreatedAtDesc(Member member, Order.OrderStatus status);
    
    /**
     * 회원의 특정 상태 주문 개수 조회
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.member = :member AND o.status = :status")
    long countByMemberAndStatus(@Param("member") Member member, @Param("status") Order.OrderStatus status);
    
    /**
     * 매칭 엔진용: 특정 종목의 매수 주문을 가격 내림차순으로 조회
     */
    @Query("SELECT o FROM Order o JOIN o.stock s WHERE s.symbol = :stockCode AND o.orderType = 'BUY' AND o.status = 'PENDING' ORDER BY o.price DESC")
    List<Order> findByStockSymbolAndOrderTypeAndStatusOrderByPriceDesc(@Param("stockCode") String stockCode);
    
    /**
     * 매칭 엔진용: 특정 종목의 매도 주문을 가격 오름차순으로 조회
     */
    @Query("SELECT o FROM Order o JOIN o.stock s WHERE s.symbol = :stockCode AND o.orderType = 'SELL' AND o.status = 'PENDING' ORDER BY o.price ASC")
    List<Order> findByStockSymbolAndOrderTypeAndStatusOrderByPriceAsc(@Param("stockCode") String stockCode);
    
    /**
     * 만료된 미체결 주문 조회 (스케줄러용)
     * 지정된 시간 범위 내에서 PENDING 또는 PARTIAL_FILLED 상태인 주문들
     */
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startTime AND :endTime " +
           "AND o.status IN ('PENDING', 'PARTIAL_FILLED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findExpiredOrders(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    /**
     * 모든 미체결 주문 조회 (디버깅용)
     * PENDING 또는 PARTIAL_FILLED 상태인 모든 주문들
     */
    @Query("SELECT o FROM Order o WHERE o.status IN ('PENDING', 'PARTIAL_FILLED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findAllPendingOrders();
    
    /**
     * 특정 날짜 이전의 미체결 주문 조회 (디버깅용)
     * 지정된 날짜 이전에 생성된 PENDING 또는 PARTIAL_FILLED 상태인 주문들
     */
    @Query("SELECT o FROM Order o WHERE o.createdAt < :beforeDate " +
           "AND o.status IN ('PENDING', 'PARTIAL_FILLED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findPendingOrdersBefore(@Param("beforeDate") LocalDateTime beforeDate);
}



