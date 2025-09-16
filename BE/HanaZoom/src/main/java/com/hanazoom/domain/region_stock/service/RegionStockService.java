package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region_stock.dto.RegionStatsResponse;
import com.hanazoom.domain.region_stock.dto.PopularityDetailsResponse;
import com.hanazoom.domain.stock.dto.StockTickerDto;
import java.util.List;

public interface RegionStockService {
    RegionStatsResponse getRegionStats(Long regionId);

    void updateRegionStocks();

    void getCurrentRegionStocks();

    List<StockTickerDto> getTopStocksByRegion(Long regionId, int limit);

    PopularityDetailsResponse getPopularityDetails(Long regionId, String symbol, String date);
}