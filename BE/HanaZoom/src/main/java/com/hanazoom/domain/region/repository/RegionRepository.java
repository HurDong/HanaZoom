package com.hanazoom.domain.region.repository;

import com.hanazoom.domain.region.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegionRepository extends JpaRepository<Region, Long> {
    List<Region> findByParentId(Long parentId);
}