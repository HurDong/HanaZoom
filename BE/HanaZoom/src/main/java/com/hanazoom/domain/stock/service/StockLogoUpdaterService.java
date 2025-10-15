package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockLogoUpdaterService {

    private final StockRepository stockRepository;
    private final RestTemplate restTemplate = new RestTemplate();


    private static final String TOSS_LOGO_URL_PATTERN = "https://thumb.tossinvest.com/image/resized/48x0/https%3A%2F%2Fstatic.toss.im%2Fpng-icons%2Fsecurities%2Ficn-sec-fill-%s.png";

    @Transactional
    public void updateAllStockLogos() {
        log.info("=== 전체 종목 로고 업데이트 시작 ===");

        List<Stock> allStocks = stockRepository.findAll();
        log.info("총 {}개 종목을 처리합니다.", allStocks.size());

        int successCount = 0;
        int failCount = 0;

        for (Stock stock : allStocks) {
            try {
                boolean updated = updateStockLogo(stock);
                if (updated) {
                    successCount++;
                    log.info("[{}] {} - 로고 업데이트 성공", stock.getSymbol(), stock.getName());
                } else {
                    failCount++;
                    log.warn("[{}] {} - 로고를 찾을 수 없습니다", stock.getSymbol(), stock.getName());
                }


                Thread.sleep(500);

            } catch (Exception e) {
                failCount++;
                log.error("[{}] {} - 로고 업데이트 실패: {}", stock.getSymbol(), stock.getName(), e.getMessage());
            }
        }

        log.info("=== 로고 업데이트 완료 ===");
        log.info("성공: {}개, 실패: {}개", successCount, failCount);
    }

    @Transactional
    public boolean updateStockLogo(Stock stock) {
        String logoUrl = generateLogoUrl(stock.getSymbol());

        if (isLogoUrlValid(logoUrl)) {
            stock.setLogoUrl(logoUrl);
            stockRepository.save(stock);
            return true;
        }

        return false;
    }

    private String generateLogoUrl(String symbol) {
        return String.format(TOSS_LOGO_URL_PATTERN, symbol);
    }

    private boolean isLogoUrlValid(String logoUrl) {
        try {
            ResponseEntity<byte[]> response = restTemplate.getForEntity(logoUrl, byte[].class);

            if (response.getStatusCode() == HttpStatus.OK) {
                byte[] body = response.getBody();
                if (body != null && body.length > 500) {

                    return true;
                }
            }

            return false;

        } catch (Exception e) {

            return false;
        }
    }

    @Transactional
    public void updateStockLogosBySymbols(List<String> symbols) {
        log.info("=== 지정된 종목 로고 업데이트 시작 ===");
        log.info("대상 종목: {}", String.join(", ", symbols));

        int successCount = 0;
        int failCount = 0;

        for (String symbol : symbols) {
            try {
                Stock stock = stockRepository.findBySymbol(symbol)
                        .orElse(null);

                if (stock == null) {
                    log.warn("종목을 찾을 수 없습니다: {}", symbol);
                    failCount++;
                    continue;
                }

                boolean updated = updateStockLogo(stock);
                if (updated) {
                    successCount++;
                    log.info("[{}] {} - 로고 업데이트 성공", stock.getSymbol(), stock.getName());
                } else {
                    failCount++;
                    log.warn("[{}] {} - 로고를 찾을 수 없습니다", stock.getSymbol(), stock.getName());
                }

                Thread.sleep(500);

            } catch (Exception e) {
                failCount++;
                log.error("종목 [{}] 로고 업데이트 실패: {}", symbol, e.getMessage());
            }
        }

        log.info("=== 지정된 종목 로고 업데이트 완료 ===");
        log.info("성공: {}개, 실패: {}개", successCount, failCount);
    }

    @Transactional
    public void updateMissingLogos() {
        log.info("=== 로고가 없는 종목 업데이트 시작 ===");

        List<Stock> stocksWithoutLogo = stockRepository.findByLogoUrlIsNull();
        log.info("로고가 없는 종목: {}개", stocksWithoutLogo.size());

        int successCount = 0;
        int failCount = 0;

        for (Stock stock : stocksWithoutLogo) {
            try {
                boolean updated = updateStockLogo(stock);
                if (updated) {
                    successCount++;
                    log.info("[{}] {} - 로고 업데이트 성공", stock.getSymbol(), stock.getName());
                } else {
                    failCount++;
                    log.warn("[{}] {} - 로고를 찾을 수 없습니다", stock.getSymbol(), stock.getName());
                }

                Thread.sleep(500);

            } catch (Exception e) {
                failCount++;
                log.error("[{}] {} - 로고 업데이트 실패: {}", stock.getSymbol(), stock.getName(), e.getMessage());
            }
        }

        log.info("=== 로고가 없는 종목 업데이트 완료 ===");
        log.info("성공: {}개, 실패: {}개", successCount, failCount);
    }
}
