package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.dto.ChartDataDto;
import com.hanazoom.domain.stock.entity.StockDailyPrice;
import com.hanazoom.domain.stock.entity.StockWeeklyPrice;
import com.hanazoom.domain.stock.entity.StockMonthlyPrice;
import com.hanazoom.domain.stock.repository.StockDailyPriceRepository;
import com.hanazoom.domain.stock.repository.StockWeeklyPriceRepository;
import com.hanazoom.domain.stock.repository.StockMonthlyPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChartService {

    private final StockDailyPriceRepository dailyPriceRepository;
    private final StockWeeklyPriceRepository weeklyPriceRepository;
    private final StockMonthlyPriceRepository monthlyPriceRepository;

    public List<ChartDataDto> getDailyChartData(String stockSymbol, int days) {
        log.info("일봉 차트 데이터 조회 시작: stockSymbol={}, days={}", stockSymbol, days);

        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days);

            log.info("일봉 차트 데이터 조회 범위: startDate={}, endDate={}", startDate, endDate);

            List<StockDailyPrice> dailyPrices = dailyPriceRepository
                    .findByStockSymbolAndTradeDateBetweenOrderByTradeDateAsc(stockSymbol, startDate, endDate);

            log.info("일봉 데이터 조회 결과: stockSymbol={}, 조회된 데이터 개수={}", stockSymbol, dailyPrices.size());

            List<ChartDataDto> result = dailyPrices.stream()
                    .map(this::convertToChartDataDto)
                    .collect(Collectors.toList());

            log.info("일봉 차트 데이터 변환 완료: stockSymbol={}, 변환된 데이터 개수={}", stockSymbol, result.size());

            return result;
        } catch (Exception e) {
            log.error("일봉 차트 데이터 조회 중 오류 발생: stockSymbol={}, error={}", stockSymbol, e.getMessage(), e);
            throw e;
        }
    }

    public List<ChartDataDto> getWeeklyChartData(String stockSymbol, int weeks) {
        log.info("주봉 차트 데이터 조회 시작: stockSymbol={}, weeks={}", stockSymbol, weeks);

        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusWeeks(weeks);

            log.info("주봉 차트 데이터 조회 범위: startDate={}, endDate={}", startDate, endDate);

            List<StockWeeklyPrice> weeklyPrices = weeklyPriceRepository
                    .findByStockSymbolAndWeekStartDateBetweenOrderByWeekStartDateAsc(stockSymbol, startDate, endDate);

            log.info("주봉 데이터 조회 결과: stockSymbol={}, 조회된 데이터 개수={}", stockSymbol, weeklyPrices.size());

            List<ChartDataDto> result = weeklyPrices.stream()
                    .map(this::convertWeeklyToChartDataDto)
                    .collect(Collectors.toList());

            log.info("주봉 차트 데이터 변환 완료: stockSymbol={}, 변환된 데이터 개수={}", stockSymbol, result.size());

            return result;
        } catch (Exception e) {
            log.error("주봉 차트 데이터 조회 중 오류 발생: stockSymbol={}, error={}", stockSymbol, e.getMessage(), e);
            throw e;
        }
    }

    public List<ChartDataDto> getMonthlyChartData(String stockSymbol, int months) {
        log.info("월봉 차트 데이터 조회 시작: stockSymbol={}, months={}", stockSymbol, months);

        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusMonths(months);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
            String startMonth = startDate.format(formatter);
            String endMonth = endDate.format(formatter);

            log.info("월봉 차트 데이터 조회 범위: startMonth={}, endMonth={}", startMonth, endMonth);

            List<StockMonthlyPrice> monthlyPrices = monthlyPriceRepository
                    .findByStockSymbolAndYearMonthBetweenOrderByYearMonthAsc(stockSymbol, startMonth, endMonth);

            log.info("월봉 데이터 조회 결과: stockSymbol={}, 조회된 데이터 개수={}", stockSymbol, monthlyPrices.size());

            List<ChartDataDto> result = monthlyPrices.stream()
                    .map(this::convertMonthlyToChartDataDto)
                    .collect(Collectors.toList());

            log.info("월봉 차트 데이터 변환 완료: stockSymbol={}, 변환된 데이터 개수={}", stockSymbol, result.size());

            return result;
        } catch (Exception e) {
            log.error("월봉 차트 데이터 조회 중 오류 발생: stockSymbol={}, error={}", stockSymbol, e.getMessage(), e);
            throw e;
        }
    }

    private ChartDataDto convertToChartDataDto(StockDailyPrice dailyPrice) {
        return ChartDataDto.builder()
                .stockSymbol(dailyPrice.getStockSymbol())
                .date(dailyPrice.getTradeDate())
                .openPrice(dailyPrice.getOpenPrice())
                .highPrice(dailyPrice.getHighPrice())
                .lowPrice(dailyPrice.getLowPrice())
                .closePrice(dailyPrice.getClosePrice())
                .volume(dailyPrice.getVolume())
                .priceChange(dailyPrice.getPriceChange())
                .priceChangePercent(dailyPrice.getPriceChangePercent())
                .build();
    }

    private ChartDataDto convertWeeklyToChartDataDto(StockWeeklyPrice weeklyPrice) {
        return ChartDataDto.builder()
                .stockSymbol(weeklyPrice.getStockSymbol())
                .date(weeklyPrice.getWeekStartDate())
                .openPrice(weeklyPrice.getOpenPrice())
                .highPrice(weeklyPrice.getHighPrice())
                .lowPrice(weeklyPrice.getLowPrice())
                .closePrice(weeklyPrice.getClosePrice())
                .volume(weeklyPrice.getVolume())
                .priceChange(weeklyPrice.getPriceChange())
                .priceChangePercent(weeklyPrice.getPriceChangePercent())
                .build();
    }

    private ChartDataDto convertMonthlyToChartDataDto(StockMonthlyPrice monthlyPrice) {

        LocalDate date = LocalDate.parse(monthlyPrice.getYearMonth() + "-01");

        return ChartDataDto.builder()
                .stockSymbol(monthlyPrice.getStockSymbol())
                .date(date)
                .openPrice(monthlyPrice.getOpenPrice())
                .highPrice(monthlyPrice.getHighPrice())
                .lowPrice(monthlyPrice.getLowPrice())
                .closePrice(monthlyPrice.getClosePrice())
                .volume(monthlyPrice.getVolume())
                .priceChange(monthlyPrice.getPriceChange())
                .priceChangePercent(monthlyPrice.getPriceChangePercent())
                .build();
    }
}
