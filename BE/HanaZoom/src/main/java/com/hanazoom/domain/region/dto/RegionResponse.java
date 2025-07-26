package com.hanazoom.domain.region.dto;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.entity.RegionType;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RegionResponse {
    private final Long id;
    private final String name;
    private final RegionType type;
    private final BigDecimal latitude;
    private final BigDecimal longitude;
    private final Long parentId;

    public RegionResponse(Region region) {
        this.id = region.getId();
        this.name = region.getName();
        this.type = region.getType();
        this.latitude = region.getLatitude();
        this.longitude = region.getLongitude();
        this.parentId = (region.getParent() != null) ? region.getParent().getId() : null;
    }
}