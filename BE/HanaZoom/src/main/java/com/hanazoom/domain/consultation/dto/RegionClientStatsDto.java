package com.hanazoom.domain.consultation.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionClientStatsDto {
    private String regionName; // 지역명
    private int clientCount; // 고객 수
    private int totalConsultations; // 총 상담 수
    private int completedConsultations; // 완료된 상담 수
    private double averageRating; // 평균 평점

    // 내부 계산용 필드들
    @Builder.Default
    private Set<UUID> uniqueClients = new HashSet<>(); // 고유 고객 ID 관리
    private int totalRating; // 평점 합계
    private int ratingCount; // 평점 개수

    public void addClient(UUID clientId) {
        uniqueClients.add(clientId);
    }

    public void incrementTotalConsultations() {
        this.totalConsultations++;
    }

    public void incrementCompletedConsultations() {
        this.completedConsultations++;
    }

    public void addRating(int rating) {
        this.totalRating += rating;
        this.ratingCount++;
    }

    public void calculateFinalStats() {
        // 고유 고객 수 계산
        this.clientCount = uniqueClients.size();

        // 평균 평점 계산
        if (ratingCount > 0) {
            this.averageRating = (double) totalRating / ratingCount;
        } else {
            this.averageRating = 0.0;
        }
    }
}
