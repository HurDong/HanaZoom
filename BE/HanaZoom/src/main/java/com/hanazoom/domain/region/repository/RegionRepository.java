package com.hanazoom.domain.region.repository;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.region.entity.RegionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {
        List<Region> findByParent(Region parent);

        // 지역명으로 지역 찾기
        Optional<Region> findByNameAndType(String name, RegionType type);

        // 계층적 구조로 지역 찾기 (시도 > 구군 > 동)
        @Query("""
                        SELECT dong FROM Region city
                        JOIN Region district ON district.parent = city
                        JOIN Region dong ON dong.parent = district
                        WHERE city.name = :cityName
                        AND district.name = :districtName
                        AND dong.name = :dongName
                        AND city.type = 'CITY'
                        AND district.type = 'DISTRICT'
                        AND dong.type = 'NEIGHBORHOOD'
                        """)
        Optional<Region> findByFullAddress(
                        @Param("cityName") String cityName,
                        @Param("districtName") String districtName,
                        @Param("dongName") String dongName);

        // 구군 레벨까지만 매칭 (동이 없는 경우)
        @Query("""
                        SELECT district FROM Region city
                        JOIN Region district ON district.parent = city
                        WHERE city.name = :cityName
                        AND district.name = :districtName
                        AND city.type = 'CITY'
                        AND district.type = 'DISTRICT'
                        """)
        Optional<Region> findByDistrictAddress(
                        @Param("cityName") String cityName,
                        @Param("districtName") String districtName);

        // 좌표 기반으로 가장 가까운 지역 찾기 (폴백 용도)
        @Query(value = """
                        SELECT r.*, (
                            6371 * acos(
                                cos(radians(:latitude)) *
                                cos(radians(CAST(r.latitude AS DOUBLE))) *
                                cos(radians(CAST(r.longitude AS DOUBLE)) - radians(:longitude)) +
                                sin(radians(:latitude)) *
                                sin(radians(CAST(r.latitude AS DOUBLE)))
                            )
                        ) AS distance
                        FROM regions r
                        WHERE r.latitude IS NOT NULL
                        AND r.longitude IS NOT NULL
                        AND r.type = 'NEIGHBORHOOD'
                        ORDER BY distance ASC
                        LIMIT 1
                        """, nativeQuery = true)
        Optional<Region> findNearestNeighborhood(
                        @Param("latitude") Double latitude,
                        @Param("longitude") Double longitude);
}