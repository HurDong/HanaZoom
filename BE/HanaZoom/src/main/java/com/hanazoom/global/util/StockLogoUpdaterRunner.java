package com.hanazoom.global.util;

import com.hanazoom.domain.stock.service.StockLogoUpdaterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "stock-logo-update")
public class StockLogoUpdaterRunner implements CommandLineRunner {

    private final StockLogoUpdaterService stockLogoUpdaterService;

    @Override
    public void run(String... args) throws Exception {
        String updateType = getPropertyValue(args, "--stock-logo-update");

        if (updateType == null) {
            return;
        }

        log.info("=== 종목 로고 업데이트 스크립트 시작 ===");
        log.info("업데이트 타입: {}", updateType);

        try {
            switch (updateType.toLowerCase()) {
                case "all":
                    log.info("전체 종목 로고 업데이트를 시작합니다...");
                    stockLogoUpdaterService.updateAllStockLogos();
                    break;

                case "missing":
                    log.info("로고가 없는 종목만 업데이트를 시작합니다...");
                    stockLogoUpdaterService.updateMissingLogos();
                    break;

                case "symbols":
                    String symbolsStr = getPropertyValue(args, "--stock-symbols");
                    if (symbolsStr == null || symbolsStr.isEmpty()) {
                        log.error("--stock-symbols 파라미터가 필요합니다. 예: --stock-symbols=005930,000660,035420");
                        return;
                    }

                    List<String> symbols = Arrays.asList(symbolsStr.split(","));
                    log.info("지정된 종목들의 로고 업데이트를 시작합니다: {}", symbols);
                    stockLogoUpdaterService.updateStockLogosBySymbols(symbols);
                    break;

                default:
                    log.error("알 수 없는 업데이트 타입입니다: {}", updateType);
                    log.info("사용 가능한 타입: all, missing, symbols");
                    return;
            }

            log.info("=== 종목 로고 업데이트 스크립트 완료 ===");

        } catch (Exception e) {
            log.error("로고 업데이트 중 오류 발생", e);
        }

        System.exit(0);
    }

    private String getPropertyValue(String[] args, String propertyName) {
        for (String arg : args) {
            if (arg.startsWith(propertyName + "=")) {
                return arg.substring(propertyName.length() + 1);
            }
        }
        return null;
    }
}
