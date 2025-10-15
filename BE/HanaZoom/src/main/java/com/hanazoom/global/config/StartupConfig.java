package com.hanazoom.global.config;

import com.hanazoom.domain.order.service.OrderExpirationScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupConfig implements ApplicationRunner {

    private final OrderExpirationScheduler orderExpirationScheduler;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("🚀 HanaZoom 서버 시작 - 초기화 작업 시작");
        
        try {

            orderExpirationScheduler.debugPendingOrders();
            

            orderExpirationScheduler.cleanupExpiredOrdersOnStartup();
            
            log.info("✅ HanaZoom 서버 초기화 완료");
            
        } catch (Exception e) {
            log.error("❌ 서버 초기화 중 오류 발생", e);

        }
    }
}
