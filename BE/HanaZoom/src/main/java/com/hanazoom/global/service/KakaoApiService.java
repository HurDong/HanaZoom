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
                .block();

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

        Long regionId = findRegionByAddressInfo(document);
        if (regionId == null && document.getLatitude() != null && document.getLongitude() != null) {
            regionId = findRegionByCoordinates(document.getLatitude(), document.getLongitude());
        }

        return regionId;
    }

    private Long findRegionByAddressInfo(KakaoAddressResponse.Document document) {
        try {

            KakaoAddressResponse.Address address = document.getAddress();
            if (address != null) {
                return matchRegionHierarchy(
                        address.getRegion1DepthName(),
                        address.getRegion2DepthName(),
                        address.getRegion3DepthName());
            }


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


        if (dongName != null && !dongName.trim().isEmpty()) {
            Region region = regionRepository.findByFullAddress(cityName, districtName, dongName)
                    .orElse(null);
            if (region != null) {
                return region.getId();
            }
        }


        Region region = regionRepository.findByDistrictAddress(cityName, districtName)
                .orElse(null);
        if (region != null) {
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