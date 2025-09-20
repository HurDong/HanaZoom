package com.hanazoom.domain.consultation.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class PbClientDto {
    private String id;
    private String name;
    private String email;
    private String region;
    private int totalConsultations;
    private int completedConsultations;
    private double averageRating;
    private BigDecimal totalAssets;
    private String riskLevel;
    private int portfolioScore;
    private String lastConsultation;
    private String nextScheduled;

    @Builder.Default
    private List<Integer> ratings = new ArrayList<>();

    public void incrementTotalConsultations() {
        this.totalConsultations++;
    }

    public void incrementCompletedConsultations() {
        this.completedConsultations++;
    }

    public void addRating(int rating) {
        this.ratings.add(rating);
        calculateAverageRating();
    }

    private void calculateAverageRating() {
        if (ratings.isEmpty()) {
            this.averageRating = 0.0;
        } else {
            this.averageRating = ratings.stream()
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(0.0);
        }
    }
}
