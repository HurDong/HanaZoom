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


    @Scheduled(fixedRate = 300000) 
    public void checkPriceChanges() {
        log.info("가격 변동 알림 체크 시작");

        try {

            List<Watchlist> allWatchlists = watchlistRepository.findAll();

            for (Watchlist watchlist : allWatchlists) {
                try {


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


        String stockSymbol = watchlist.getStock().getSymbol();
        String stockName = watchlist.getStock().getName();


        double priceChangePercent = generateRandomPriceChange();
        long currentPrice = generateRandomCurrentPrice();


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


    private double generateRandomPriceChange() {
        return (Math.random() - 0.5) * 40.0; 
    }


    private long generateRandomCurrentPrice() {
        return (long) (Math.random() * 990000 + 10000);
    }


    public void checkSpecificStockPriceChange(UUID memberId, String stockSymbol,
            String stockName, Double priceChangePercent,
            Long currentPrice) {
        if (Math.abs(priceChangePercent) >= 5.0) {
            notificationService.createPriceChangeNotification(
                    memberId, stockSymbol, stockName, priceChangePercent, currentPrice);
        }
    }
}
