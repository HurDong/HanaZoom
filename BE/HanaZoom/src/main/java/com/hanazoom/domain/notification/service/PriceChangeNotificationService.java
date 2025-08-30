package com.hanazoom.domain.notification.service;

import com.hanazoom.domain.watchlist.entity.Watchlist;
import com.hanazoom.domain.watchlist.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceChangeNotificationService {

    private final WatchlistRepository watchlistRepository;
    private final NotificationService notificationService;

    // 5분마다 실행 (실시간 주식 데이터 업데이트 주기와 맞춤)
    @Scheduled(fixedRate = 300000) // 5분 = 300,000ms
    public void checkPriceChanges() {
        log.info("가격 변동 알림 체크 시작");

        try {
            // 모든 관심종목 조회
            List<Watchlist> allWatchlists = watchlistRepository.findAll();

            for (Watchlist watchlist : allWatchlists) {
                try {
                    // 실제 주식 가격 데이터는 외부 API에서 가져와야 함
                    // 여기서는 목데이터를 사용하여 테스트
                    checkAndCreatePriceNotification(watchlist);
                } catch (Exception e) {
                    log.error("관심종목 {} 가격 변동 체크 실패: {}",
                            watchlist.getStock().getSymbol(), e.getMessage());
                }
            }

            log.info("가격 변동 알림 체크 완료");
        } catch (Exception e) {
            log.error("가격 변동 알림 체크 중 오류 발생: {}", e.getMessage());
        }
    }

    private void checkAndCreatePriceNotification(Watchlist watchlist) {
        // TODO: 실제 주식 가격 데이터 API 연동 필요
        // 현재는 목데이터로 테스트

        String stockSymbol = watchlist.getStock().getSymbol();
        String stockName = watchlist.getStock().getName();

        // 목데이터: 랜덤한 가격 변동 생성
        double priceChangePercent = generateRandomPriceChange();
        long currentPrice = generateRandomCurrentPrice();

        // 5% 이상의 변동이 있을 때만 알림 생성
        if (Math.abs(priceChangePercent) >= 5.0) {
            log.info("가격 변동 감지: {} - {}% (현재가: {}원)",
                    stockName, priceChangePercent, currentPrice);

            notificationService.createPriceChangeNotification(
                    watchlist.getMember().getId(),
                    stockSymbol,
                    stockName,
                    priceChangePercent,
                    currentPrice);
        }
    }

    // 목데이터용 랜덤 가격 변동 생성 (-20% ~ +20%)
    private double generateRandomPriceChange() {
        return (Math.random() - 0.5) * 40.0; // -20% ~ +20%
    }

    // 목데이터용 랜덤 현재가 생성 (10,000원 ~ 1,000,000원)
    private long generateRandomCurrentPrice() {
        return (long) (Math.random() * 990000 + 10000);
    }

    // 특정 종목의 가격 변동 체크 (수동 호출용)
    public void checkSpecificStockPriceChange(UUID memberId, String stockSymbol,
            String stockName, Double priceChangePercent,
            Long currentPrice) {
        if (Math.abs(priceChangePercent) >= 5.0) {
            notificationService.createPriceChangeNotification(
                    memberId, stockSymbol, stockName, priceChangePercent, currentPrice);
        }
    }
}
