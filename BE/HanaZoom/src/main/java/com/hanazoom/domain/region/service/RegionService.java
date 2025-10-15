package com.hanazoom.domain.region.service;

import com.hanazoom.domain.region.dto.RegionResponse;
import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.entity.RegionType;
import com.hanazoom.domain.region.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegionService {

    private final RegionRepository regionRepository;

    public List<RegionResponse> getAllRegions() {
        return regionRepository.findAll().stream()
                .map(RegionResponse::new)
                .collect(Collectors.toList());
    }

    public String getRegionName(Long regionId) {
        return regionRepository.findById(regionId)
                .map(Region::getName)
                .orElse(null);
    }

    public String getFullRegionName(Long regionId) {
        return regionRepository.findById(regionId)
                .map(region -> {
                    StringBuilder fullName = new StringBuilder();


                    if (region.getType() == RegionType.NEIGHBORHOOD) {
                        fullName.append(region.getName());


                        if (region.getParent() != null && region.getParent().getType() == RegionType.DISTRICT) {
                            fullName.insert(0, region.getParent().getName() + " ");


                            if (region.getParent().getParent() != null
                                    && region.getParent().getParent().getType() == RegionType.CITY) {
                                fullName.insert(0, region.getParent().getParent().getName() + " ");
                            }
                        }
                    } else if (region.getType() == RegionType.DISTRICT) {
                        fullName.append(region.getName());


                        if (region.getParent() != null && region.getParent().getType() == RegionType.CITY) {
                            fullName.insert(0, region.getParent().getName() + " ");
                        }
                    } else {
                        fullName.append(region.getName());
                    }

                    return fullName.toString();
                })
                .orElse(null);
    }
}