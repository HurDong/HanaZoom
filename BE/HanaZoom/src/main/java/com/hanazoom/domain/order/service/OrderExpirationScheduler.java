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

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;
    private static final int SUMMARY_LIMIT = 20;

    private String summarizeIds(java.util.Collection<Long> ids, int limit) {
        if (ids == null || ids.isEmpty()) return "[]";
        java.util.List<Long> list = new java.util.ArrayList<>(ids);
        int extra = Math.max(0, list.size() - limit);
        java.util.List<Long> head = list.subList(0, Math.min(limit, list.size()));
        return extra > 0 ? head.toString() + " (+" + extra + ")" : head.toString();
    }

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cancelExpiredOrders() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        

        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.atTime(LocalTime.MAX);
        
        log.info("🕛 매일 자정 스케줄러 실행 - 만료된 미체결 주문 취소 처리 시작");
        log.info("📅 처리 대상 날짜: {} ({} ~ {})", yesterday, startOfYesterday, endOfYesterday);

        try {

            List<Order> expiredOrders = orderRepository.findExpiredOrders(
                startOfYesterday, 
                endOfYesterday
            );

            log.info("🔍 만료된 미체결 주문: {}건, ids={}", expiredOrders.size(),
                summarizeIds(expiredOrders.stream().map(Order::getId).toList(), SUMMARY_LIMIT));
            

            for (Order order : expiredOrders) {
                log.debug("📋 만료 주문 상세: orderId={}, status={}, createdAt={}, stockCode={}, memberId={}", 
                    order.getId(), 
                    order.getStatus(), 
                    order.getCreatedAt(),
                    order.getStock().getSymbol(),
                    order.getMember().getId());
            }

            int cancelledCount = 0;
            java.util.List<Long> cancelledIds = new java.util.ArrayList<>();
            for (Order order : expiredOrders) {
                try {
                    log.info("🔄 주문 취소 처리 시작: orderId={}, 현재상태={}", order.getId(), order.getStatus());
                    

                    order.cancel();
                    orderRepository.save(order);
                    cancelledCount++;
                    cancelledIds.add(order.getId());
                    
                    log.debug("✅ 미체결 주문 자동 취소 완료: orderId={}, memberId={}, stockCode={}, 취소시간={}", 
                        order.getId(), 
                        order.getMember().getId(),
                        order.getStock().getSymbol(),
                        order.getCancelTime());
                        
                } catch (Exception e) {
                    log.error("❌ 주문 취소 처리 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
                }
            }

            log.info("🎯 만료 미체결 취소 완료: {}건, ids={}", cancelledCount, summarizeIds(cancelledIds, SUMMARY_LIMIT));

        } catch (Exception e) {
            log.error("💥 만료된 미체결 주문 취소 처리 중 오류 발생: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void cleanupExpiredOrdersOnStartup() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        
        log.info("🚀 서버 시작 시 만료된 주문 정리 시작");
        log.info("📅 조회 기준: 오늘 이전의 모든 미체결 주문 ({} 이전)", todayStart);

        try {

            List<Order> expiredOrders = orderRepository.findPendingOrdersBefore(todayStart);
            
            log.info("🔍 오늘 이전 미체결 주문: {}건, ids={}", expiredOrders.size(),
                summarizeIds(expiredOrders.stream().map(Order::getId).toList(), SUMMARY_LIMIT));
            
            if (expiredOrders.isEmpty()) {
                log.info("✅ 정리할 만료된 주문이 없습니다.");
                return;
            }

            for (Order order : expiredOrders) {
                log.debug("📋 만료 주문 상세: orderId={}, status={}, createdAt={}, stockCode={}, memberId={}", 
                    order.getId(), 
                    order.getStatus(), 
                    order.getCreatedAt(),
                    order.getStock().getSymbol(),
                    order.getMember().getId());
            }

            int cancelledCount = 0;
            java.util.List<Long> cancelledIds = new java.util.ArrayList<>();
            for (Order order : expiredOrders) {
                try {
                    log.info("🔄 서버 시작 시 주문 취소 처리: orderId={}, 현재상태={}", order.getId(), order.getStatus());
                    
                    order.cancel();
                    orderRepository.save(order);
                    cancelledCount++;
                    cancelledIds.add(order.getId());
                    
                    log.debug("✅ 서버 시작 시 만료 주문 취소 완료: orderId={}, memberId={}, stockCode={}, 취소시간={}", 
                        order.getId(), 
                        order.getMember().getId(),
                        order.getStock().getSymbol(),
                        order.getCancelTime());
                        
                } catch (Exception e) {
                    log.error("❌ 서버 시작 시 주문 취소 실패: orderId={}, error={}", order.getId(), e.getMessage(), e);
                }
            }

            log.info("🎯 서버 시작 시 만료 주문 정리 완료: {}건, ids={}", cancelledCount, summarizeIds(cancelledIds, SUMMARY_LIMIT));

        } catch (Exception e) {
            log.error("💥 서버 시작 시 만료된 주문 정리 중 오류 발생: {}", e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public void debugPendingOrders() {
        log.info("🔍 디버깅: 모든 미체결 주문 조회 시작");
        
        try {

            List<Order> allPendingOrders = orderRepository.findAllPendingOrders();
            log.info("📊 전체 미체결 주문: {}건, ids={}", allPendingOrders.size(),
                summarizeIds(allPendingOrders.stream().map(Order::getId).toList(), SUMMARY_LIMIT));
            
            for (Order order : allPendingOrders) {
                log.debug("📋 미체결 주문: orderId={}, status={}, createdAt={}, stockCode={}, memberId={}", 
                    order.getId(), 
                    order.getStatus(), 
                    order.getCreatedAt(),
                    order.getStock().getSymbol(),
                    order.getMember().getId());
            }
            

            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            List<Order> oldPendingOrders = orderRepository.findPendingOrdersBefore(todayStart);
            log.info("📅 오늘 이전 미체결 주문: {}건, ids={}", oldPendingOrders.size(),
                summarizeIds(oldPendingOrders.stream().map(Order::getId).toList(), SUMMARY_LIMIT));
            
            for (Order order : oldPendingOrders) {
                log.debug("📋 오늘 이전 미체결 주문: orderId={}, status={}, createdAt={}, stockCode={}, memberId={}", 
                    order.getId(), 
                    order.getStatus(), 
                    order.getCreatedAt(),
                    order.getStock().getSymbol(),
                    order.getMember().getId());
            }
            
        } catch (Exception e) {
            log.error("💥 디버깅 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}
