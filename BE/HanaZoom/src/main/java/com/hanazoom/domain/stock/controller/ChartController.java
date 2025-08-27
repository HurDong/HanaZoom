package com.hanazoom.domain.stock.controller;

import com.hanazoom.domain.stock.dto.ChartDataDto;
import com.hanazoom.domain.stock.service.ChartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/charts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class ChartController {

    private final ChartService chartService;

    @GetMapping("/daily/{stockSymbol}")
    public ResponseEntity<List<ChartDataDto>> getDailyChartData(
            @PathVariable String stockSymbol,
            @RequestParam(defaultValue = "30") int days) {

        try {
            log.info("일봉 차트 데이터 요청: stockSymbol={}, days={}", stockSymbol, days);

            List<ChartDataDto> chartData = chartService.getDailyChartData(stockSymbol, days);

            log.info("일봉 차트 데이터 조회 성공: stockSymbol={}, 데이터 개수={}", stockSymbol, chartData.size());

            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            log.error("일봉 차트 데이터 조회 실패: stockSymbol={}, error={}", stockSymbol, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/weekly/{stockSymbol}")
    public ResponseEntity<List<ChartDataDto>> getWeeklyChartData(
            @PathVariable String stockSymbol,
            @RequestParam(defaultValue = "12") int weeks) {

        try {
            log.info("주봉 차트 데이터 요청: stockSymbol={}, weeks={}", stockSymbol, weeks);

            List<ChartDataDto> chartData = chartService.getWeeklyChartData(stockSymbol, weeks);

            log.info("주봉 차트 데이터 조회 성공: stockSymbol={}, 데이터 개수={}", stockSymbol, chartData.size());

            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            log.error("주봉 차트 데이터 조회 실패: stockSymbol={}, error={}", stockSymbol, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/monthly/{stockSymbol}")
    public ResponseEntity<List<ChartDataDto>> getMonthlyChartData(
            @PathVariable String stockSymbol,
            @RequestParam(defaultValue = "12") int months) {

        try {
            log.info("월봉 차트 데이터 요청: stockSymbol={}, months={}", stockSymbol, months);

            List<ChartDataDto> chartData = chartService.getMonthlyChartData(stockSymbol, months);

            log.info("월봉 차트 데이터 조회 성공: stockSymbol={}, 데이터 개수={}", stockSymbol, chartData.size());

            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            log.error("월봉 차트 데이터 조회 실패: stockSymbol={}, error={}", stockSymbol, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
