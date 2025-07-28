package com.hanazoom.global.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class KakaoAddressResponse {

    private List<Document> documents;

    @Getter
    @NoArgsConstructor
    public static class Document {
        @JsonProperty("y")
        private Double latitude; // 위도

        @JsonProperty("x")
        private Double longitude; // 경도

        @JsonProperty("address")
        private Address address; // 주소 정보

        @JsonProperty("road_address")
        private RoadAddress roadAddress; // 도로명 주소 정보
    }

    @Getter
    @NoArgsConstructor
    public static class Address {
        @JsonProperty("address_name")
        private String addressName; // 전체 주소

        @JsonProperty("region_1depth_name")
        private String region1DepthName; // 시도명 (예: 서울특별시)

        @JsonProperty("region_2depth_name")
        private String region2DepthName; // 구군명 (예: 강남구)

        @JsonProperty("region_3depth_name")
        private String region3DepthName; // 동면명 (예: 삼성동)
    }

    @Getter
    @NoArgsConstructor
    public static class RoadAddress {
        @JsonProperty("address_name")
        private String addressName; // 전체 도로명 주소

        @JsonProperty("region_1depth_name")
        private String region1DepthName; // 시도명

        @JsonProperty("region_2depth_name")
        private String region2DepthName; // 구군명

        @JsonProperty("region_3depth_name")
        private String region3DepthName; // 동명
    }
}