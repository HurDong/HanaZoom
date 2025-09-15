package com.hanazoom.global.config;

import com.hanazoom.domain.order.service.OrderExpirationScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 서버 시작 시 실행되는 초기화 작업들
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StartupConfig implements ApplicationRunner {

    private final OrderExpirationScheduler orderExpirationScheduler;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("🚀 HanaZoom 서버 시작 - 초기화 작업 시작");
        
        try {
            // 서버 시작 시 만료된 주문들 정리
            orderExpirationScheduler.cleanupExpiredOrdersOnStartup();
            
            log.info("✅ HanaZoom 서버 초기화 완료");
            
        } catch (Exception e) {
            log.error("❌ 서버 초기화 중 오류 발생", e);
            // 초기화 오류가 있어도 서버는 계속 실행되도록 함
        }
    }
}
