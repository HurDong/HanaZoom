package com.hanazoom.domain.region_stock.controller;

import com.hanazoom.domain.region_stock.dto.RegionStatsResponse;
import com.hanazoom.domain.region_stock.service.RegionStockService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}