package com.hanazoom.domain.region_stock.controller;

import com.hanazoom.domain.region_stock.dto.RegionStatsResponse;
import com.hanazoom.domain.region_stock.dto.PopularityDetailsResponse;
import com.hanazoom.domain.region_stock.service.RegionStockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import java.util.List;

@RestController
@RequestMapping("/api/v1/regions")
@RequiredArgsConstructor
public class RegionStockController {

    private final RegionStockService regionStockService;

    @GetMapping("/{regionId}/stats")
    public ResponseEntity<ApiResponse<RegionStatsResponse>> getRegionStats(
            @PathVariable Long regionId) {
        try {
            RegionStatsResponse stats = regionStockService.getRegionStats(regionId);
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("지역 통계 정보를 가져오는데 실패했습니다."));
        }
    }

    @GetMapping("/{regionId}/top-stocks")
    public ResponseEntity<ApiResponse<List<StockTickerDto>>> getTopStocksByRegion(@PathVariable Long regionId) {
        try {
            List<StockTickerDto> topStocks = regionStockService.getTopStocksByRegion(regionId, 3);
            return ResponseEntity.ok(ApiResponse.success(topStocks));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("지역 상위 주식 정보를 가져오는데 실패했습니다."));
        }
    }

    @GetMapping("/{regionId}/stocks/{symbol}/popularity")
    public ResponseEntity<ApiResponse<PopularityDetailsResponse>> getPopularityDetails(
            @PathVariable Long regionId,
            @PathVariable String symbol,
            @RequestParam(name = "date", required = false, defaultValue = "latest") String date
    ) {
        try {
            PopularityDetailsResponse details = regionStockService.getPopularityDetails(regionId, symbol, date);
            return ResponseEntity.ok(ApiResponse.success(details));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("인기도 상세 정보를 가져오는데 실패했습니다."));
        }
    }
}