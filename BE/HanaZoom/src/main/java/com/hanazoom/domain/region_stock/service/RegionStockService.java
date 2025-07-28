package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region_stock.dto.RegionStatsResponse;

public interface RegionStockService {
    RegionStatsResponse getRegionStats(Long regionId);

    void updateRegionStocks();

    void getCurrentRegionStocks();
}