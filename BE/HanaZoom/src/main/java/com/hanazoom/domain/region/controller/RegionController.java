package com.hanazoom.domain.region.controller;

import com.hanazoom.domain.region.dto.RegionResponse;
import com.hanazoom.domain.region.service.RegionService;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegionResponse>>> getAllRegions() {
        List<RegionResponse> regions = regionService.getAllRegions();
        return ResponseEntity.ok(ApiResponse.success(regions));
    }
}