package com.hanazoom.domain.order.repository;

import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}



