package com.hanazoom.global.service;

import com.hanazoom.global.dto.KakaoAddressResponse;
import com.hanazoom.domain.region.repository.RegionRepository;
import com.hanazoom.domain.region.entity.Region;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoApiService {

    @Qualifier("kakaoWebClient")
    private final WebClient kakaoWebClient;
    private final RegionRepository regionRepository;

    public KakaoAddressResponse.Document getCoordinates(String address) {
        KakaoAddressResponse response = kakaoWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/address.json")
                        .queryParam("query", address)
                        .build())
                .retrieve()
                .bodyToMono(KakaoAddressResponse.class)
                .block(); // 비동기 결과를 동기적으로 기다림

        if (response != null && response.getDocuments() != null && !response.getDocuments().isEmpty()) {
            return response.getDocuments().get(0);
        }
        return null;
    }

    public Long getRegionIdFromAddress(String address) {
        KakaoAddressResponse.Document document = getCoordinates(address);

        if (document == null) {
            log.warn("주소 정보를 찾을 수 없습니다: {}", address);
            return null;
        }

        // 1. 먼저 행정구역 정보로 매칭 시도
        Long regionId = findRegionByAddressInfo(document);

        // 2. 행정구역 정보로 찾지 못한 경우 좌표로 매칭
        if (regionId == null && document.getLatitude() != null && document.getLongitude() != null) {
            regionId = findRegionByCoordinates(document.getLatitude(), document.getLongitude());
        }

        return regionId;
    }

    private Long findRegionByAddressInfo(KakaoAddressResponse.Document document) {
        try {
            // 일반 주소 정보 우선 사용
            KakaoAddressResponse.Address address = document.getAddress();
            if (address != null) {
                return matchRegionHierarchy(
                        address.getRegion1DepthName(),
                        address.getRegion2DepthName(),
                        address.getRegion3DepthName());
            }

            // 도로명 주소 정보 사용
            KakaoAddressResponse.RoadAddress roadAddress = document.getRoadAddress();
            if (roadAddress != null) {
                return matchRegionHierarchy(
                        roadAddress.getRegion1DepthName(),
                        roadAddress.getRegion2DepthName(),
                        roadAddress.getRegion3DepthName());
            }
        } catch (Exception e) {
            log.error("주소 정보 매칭 중 오류 발생", e);
        }

        return null;
    }

    private Long matchRegionHierarchy(String cityName, String districtName, String dongName) {
        if (cityName == null || districtName == null) {
            return null;
        }

        // 동명까지 있는 경우 전체 매칭 시도
        if (dongName != null && !dongName.trim().isEmpty()) {
            Region region = regionRepository.findByFullAddress(cityName, districtName, dongName)
                    .orElse(null);
            if (region != null) {
                log.debug("전체 주소로 매칭됨: {} {} {}", cityName, districtName, dongName);
                return region.getId();
            }
        }

        // 동이 없거나 매칭되지 않은 경우 구군 레벨까지만 매칭
        Region region = regionRepository.findByDistrictAddress(cityName, districtName)
                .orElse(null);
        if (region != null) {
            log.debug("구군 레벨로 매칭됨: {} {}", cityName, districtName);
            return region.getId();
        }

        return null;
    }

    private Long findRegionByCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return null;
        }

        return regionRepository.findNearestNeighborhood(latitude, longitude)
                .map(Region::getId)
                .orElse(null);
    }
}