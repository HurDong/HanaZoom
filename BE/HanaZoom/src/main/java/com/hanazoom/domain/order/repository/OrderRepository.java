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
    
    Optional<Order> findByIdAndMember(Long orderId, Member member);
    
    Page<Order> findByMemberOrderByCreatedAtDesc(Member member, Pageable pageable);
    
    @Query("SELECT o FROM Order o WHERE o.member = :member AND o.stock.symbol = :stockSymbol ORDER BY o.createdAt DESC")
    Page<Order> findByMemberAndStockSymbolOrderByCreatedAtDesc(@Param("member") Member member, @Param("stockSymbol") String stockSymbol, Pageable pageable);
    
    List<Order> findByMemberAndStatusOrderByCreatedAtDesc(Member member, Order.OrderStatus status);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.member = :member AND o.status = :status")
    long countByMemberAndStatus(@Param("member") Member member, @Param("status") Order.OrderStatus status);
    
    @Query("SELECT o FROM Order o JOIN o.stock s WHERE s.symbol = :stockCode AND o.orderType = 'BUY' AND o.status = 'PENDING' ORDER BY o.price DESC")
    List<Order> findByStockSymbolAndOrderTypeAndStatusOrderByPriceDesc(@Param("stockCode") String stockCode);
    
    @Query("SELECT o FROM Order o JOIN o.stock s WHERE s.symbol = :stockCode AND o.orderType = 'SELL' AND o.status = 'PENDING' ORDER BY o.price ASC")
    List<Order> findByStockSymbolAndOrderTypeAndStatusOrderByPriceAsc(@Param("stockCode") String stockCode);
    
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startTime AND :endTime " +
           "AND o.status IN ('PENDING', 'PARTIAL_FILLED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findExpiredOrders(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT o FROM Order o WHERE o.status IN ('PENDING', 'PARTIAL_FILLED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findAllPendingOrders();
    
    @Query("SELECT o FROM Order o WHERE o.createdAt < :beforeDate " +
           "AND o.status IN ('PENDING', 'PARTIAL_FILLED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findPendingOrdersBefore(@Param("beforeDate") LocalDateTime beforeDate);
}



