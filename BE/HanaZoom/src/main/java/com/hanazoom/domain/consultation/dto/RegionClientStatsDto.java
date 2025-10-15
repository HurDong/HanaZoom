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
    private String regionName; 
    private int clientCount; 
    private int totalConsultations; 
    private int completedConsultations; 
    private double averageRating; 


    @Builder.Default
    private Set<UUID> uniqueClients = new HashSet<>(); 
    private int totalRating; 
    private int ratingCount; 

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

        this.clientCount = uniqueClients.size();


        if (ratingCount > 0) {
            this.averageRating = (double) totalRating / ratingCount;
        } else {
            this.averageRating = 0.0;
        }
    }
}
