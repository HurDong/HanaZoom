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
        private Double latitude; 

        @JsonProperty("x")
        private Double longitude; 

        @JsonProperty("address")
        private Address address; 

        @JsonProperty("road_address")
        private RoadAddress roadAddress; 
    }

    @Getter
    @NoArgsConstructor
    public static class Address {
        @JsonProperty("address_name")
        private String addressName; 

        @JsonProperty("region_1depth_name")
        private String region1DepthName; 

        @JsonProperty("region_2depth_name")
        private String region2DepthName; 

        @JsonProperty("region_3depth_name")
        private String region3DepthName; 
    }

    @Getter
    @NoArgsConstructor
    public static class RoadAddress {
        @JsonProperty("address_name")
        private String addressName; 

        @JsonProperty("region_1depth_name")
        private String region1DepthName; 

        @JsonProperty("region_2depth_name")
        private String region2DepthName; 

        @JsonProperty("region_3depth_name")
        private String region3DepthName; 
    }
}