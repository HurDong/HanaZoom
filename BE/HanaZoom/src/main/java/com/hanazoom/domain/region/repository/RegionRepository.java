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


        Optional<Region> findByNameAndType(String name, RegionType type);


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


        @Query("SELECT r FROM Region r WHERE r.id = :regionId AND r.type = 'DISTRICT'")
        Optional<Region> findDistrictByRegionId(@Param("regionId") Long regionId);
        

        @Query("SELECT r.parent FROM Region r WHERE r.id = :regionId AND r.type = 'NEIGHBORHOOD'")
        Optional<Region> findDistrictByNeighborhoodId(@Param("regionId") Long regionId);


        @Query("SELECT r.name FROM Region r WHERE r.id = :regionId")
        Optional<String> findRegionNameById(@Param("regionId") Long regionId);
}