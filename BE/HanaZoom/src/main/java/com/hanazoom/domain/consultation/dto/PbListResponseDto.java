package com.hanazoom.domain.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PbListResponseDto {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String region;
    private String regionName;
    private Double rating;
    private Integer totalConsultations;
    private List<String> specialties;
    private Integer experienceYears;
    private String profileImage;
    private String introduction;
    private boolean isAvailable;
    private String statusMessage;
}
