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
    }
}