package com.hanazoom.domain.region_stock.service;

import com.hanazoom.domain.region_stock.entity.RegionStock;
import java.util.List;

public interface RegionStockService {
    void updateRegionStocks();

    List<RegionStock> getCurrentRegionStocks();
}