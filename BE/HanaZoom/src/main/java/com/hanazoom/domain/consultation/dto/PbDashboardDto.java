package com.hanazoom.domain.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PbDashboardDto {


    private String pbId;
    private String pbName;
    private String pbRegion;
    private Double pbRating;
    private Integer totalConsultations;


    private List<ConsultationSummaryDto> todayConsultations;
    private int todayConsultationCount;


    private List<ConsultationSummaryDto> pendingConsultations;
    private int pendingConsultationCount;


    private List<ConsultationSummaryDto> inProgressConsultations;
    private int inProgressConsultationCount;


    private List<ConsultationSummaryDto> recentConsultations;


    private long totalCompletedConsultations;
    private Double averageRating;
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;


    private Map<String, Long> consultationTypeStatistics;


    private Map<String, Long> monthlyStatistics;


    private ConsultationSummaryDto nextConsultation;


    private boolean isActive;
    private String statusMessage;
}
