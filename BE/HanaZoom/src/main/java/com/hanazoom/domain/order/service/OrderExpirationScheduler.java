package com.hanazoom.domain.order.service;

import com.hanazoom.domain.order.entity.Order;
import com.hanazoom.domain.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 주문 만료 처리 스케줄러
 * 매일 자정에 전날 미체결 주문을 자동으로 취소 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;

    /**
     * 매일 자정에 전날 미체결 주문을 자동 취소
     * cron = "0 0 0 * * ?" : 매일 00:00:00에 실행
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cancelExpiredOrders() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        
        // 전날 00:00:00부터 23:59:59까지의 시간 범위
        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.atTime(LocalTime.MAX);
        
        log.info("만료된 미체결 주문 취소 처리 시작: {}", yesterday);

        try {
            // 전날 생성된 미체결 주문 조회 (PENDING, PARTIAL_FILLED 상태)
            List<Order> expiredOrders = orderRepository.findExpiredOrders(
                startOfYesterday, 
                endOfYesterday
            );

            log.info("만료된 미체결 주문 발견: {}건", expiredOrders.size());

            int cancelledCount = 0;
            for (Order order : expiredOrders) {
                try {
                    // 주문 취소 처리
                    order.cancel();
                    orderRepository.save(order);
                    cancelledCount++;
                    
                    log.info("미체결 주문 자동 취소 완료: orderId={}, memberId={}, stockCode={}", 
                        order.getId(), 
                        order.getMember().getId(),
                        order.getStock().getSymbol());
                        
                } catch (Exception e) {
                    log.error("주문 취소 처리 실패: orderId={}, error={}", order.getId(), e.getMessage());
                }
            }

            log.info("만료된 미체결 주문 취소 처리 완료: {}건 처리됨", cancelledCount);

        } catch (Exception e) {
            log.error("만료된 미체결 주문 취소 처리 중 오류 발생: {}", e.getMessage(), e);
        }
    }

    /**
     * 서버 시작 시 기존 만료된 주문들 정리
     * 서버가 중단되었다가 재시작된 경우 누락된 만료 주문들을 처리
     */
    @Transactional
    public void cleanupExpiredOrdersOnStartup() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysAgo = today.minusDays(3); // 3일 전부터 조회
        
        LocalDateTime startTime = threeDaysAgo.atStartOfDay();
        LocalDateTime endTime = today.atStartOfDay();
        
        log.info("서버 시작 시 만료된 주문 정리 시작: {} ~ {}", startTime, endTime);

        try {
            List<Order> expiredOrders = orderRepository.findExpiredOrders(startTime, endTime);
            
            if (expiredOrders.isEmpty()) {
                log.info("정리할 만료된 주문이 없습니다.");
                return;
            }

            log.info("서버 시작 시 만료된 주문 발견: {}건", expiredOrders.size());

            int cancelledCount = 0;
            for (Order order : expiredOrders) {
                try {
                    order.cancel();
                    orderRepository.save(order);
                    cancelledCount++;
                    
                    log.info("서버 시작 시 만료 주문 취소: orderId={}, memberId={}, stockCode={}", 
                        order.getId(), 
                        order.getMember().getId(),
                        order.getStock().getSymbol());
                        
                } catch (Exception e) {
                    log.error("서버 시작 시 주문 취소 실패: orderId={}, error={}", order.getId(), e.getMessage());
                }
            }

            log.info("서버 시작 시 만료된 주문 정리 완료: {}건 처리됨", cancelledCount);

        } catch (Exception e) {
            log.error("서버 시작 시 만료된 주문 정리 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}
