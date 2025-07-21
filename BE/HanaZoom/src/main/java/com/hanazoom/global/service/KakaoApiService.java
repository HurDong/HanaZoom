package com.hanazoom.global.service;

import com.hanazoom.global.dto.KakaoAddressResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class KakaoApiService {

    private final WebClient webClient;

    public KakaoAddressResponse.Document getCoordinates(String address) {
        KakaoAddressResponse response = webClient.get()
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
}