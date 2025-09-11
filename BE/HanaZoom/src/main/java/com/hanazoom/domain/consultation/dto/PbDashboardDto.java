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

    // PB 기본 정보
    private String pbId;
    private String pbName;
    private String pbRegion;
    private Double pbRating;
    private Integer totalConsultations;

    // 오늘의 상담
    private List<ConsultationSummaryDto> todayConsultations;
    private int todayConsultationCount;

    // 대기중인 상담
    private List<ConsultationSummaryDto> pendingConsultations;
    private int pendingConsultationCount;

    // 진행중인 상담
    private List<ConsultationSummaryDto> inProgressConsultations;
    private int inProgressConsultationCount;

    // 최근 상담 목록
    private List<ConsultationSummaryDto> recentConsultations;

    // 통계 정보
    private long totalCompletedConsultations;
    private Double averageRating;
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;

    // 상담 유형별 통계
    private Map<String, Long> consultationTypeStatistics;

    // 월별 상담 통계
    private Map<String, Long> monthlyStatistics;

    // 다음 예정된 상담
    private ConsultationSummaryDto nextConsultation;

    // PB 상태
    private boolean isActive;
    private String statusMessage;
}
