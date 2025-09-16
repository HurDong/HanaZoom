package com.hanazoom.domain.consultation.repository;

import com.hanazoom.domain.consultation.entity.Consultation;
import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import com.hanazoom.domain.consultation.entity.ConsultationType;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {

    // 고객별 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.client.id = :clientId ORDER BY c.scheduledAt DESC")
    Page<Consultation> findByClientId(@Param("clientId") UUID clientId, Pageable pageable);

    // PB별 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId ORDER BY c.scheduledAt DESC")
    Page<Consultation> findByPbId(@Param("pbId") UUID pbId, Pageable pageable);

    // PB별 특정 상태의 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status ORDER BY c.scheduledAt ASC")
    List<Consultation> findByPbIdAndStatus(@Param("pbId") UUID pbId, @Param("status") ConsultationStatus status);

    // 고객별 특정 상태의 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.client.id = :clientId AND c.status = :status ORDER BY c.scheduledAt DESC")
    List<Consultation> findByClientIdAndStatus(@Param("clientId") UUID clientId, @Param("status") ConsultationStatus status);

    // PB와 고객 간의 상담 관계 확인
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.client.id = :clientId AND c.status IN :statuses")
    List<Consultation> findByPbIdAndClientIdAndStatusIn(@Param("pbId") UUID pbId, @Param("clientId") UUID clientId, @Param("statuses") List<ConsultationStatus> statuses);

    // 특정 날짜 범위의 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt BETWEEN :startDate AND :endDate ORDER BY c.scheduledAt ASC")
    List<Consultation> findByPbIdAndScheduledAtBetween(@Param("pbId") UUID pbId, 
                                                      @Param("startDate") LocalDateTime startDate, 
                                                      @Param("endDate") LocalDateTime endDate);

    // 특정 날짜 범위의 예약된 상담 목록 조회 (예약 가능한 시간 계산용)
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt BETWEEN :startDate AND :endDate AND c.status IN ('PENDING', 'APPROVED', 'IN_PROGRESS') ORDER BY c.scheduledAt ASC")
    List<Consultation> findBookedConsultationsByPbIdAndScheduledAtBetween(@Param("pbId") UUID pbId, 
                                                                         @Param("startDate") LocalDateTime startDate, 
                                                                         @Param("endDate") LocalDateTime endDate);

    // 특정 날짜 이후의 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt >= :startDate ORDER BY c.scheduledAt ASC")
    List<Consultation> findByPbIdAndScheduledAtAfter(@Param("pbId") UUID pbId, @Param("startDate") LocalDateTime startDate);

    // 특정 날짜 이전의 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt <= :endDate ORDER BY c.scheduledAt ASC")
    List<Consultation> findByPbIdAndScheduledAtBefore(@Param("pbId") UUID pbId, @Param("endDate") LocalDateTime endDate);

    // 특정 상담 유형의 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.consultationType = :type ORDER BY c.scheduledAt DESC")
    Page<Consultation> findByPbIdAndConsultationType(@Param("pbId") UUID pbId, 
                                                    @Param("type") ConsultationType type, 
                                                    Pageable pageable);

    // 대기중인 상담 목록 조회 (PB용)
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status = 'PENDING' ORDER BY c.createdAt ASC")
    List<Consultation> findPendingConsultationsByPbId(@Param("pbId") UUID pbId);

    // 오늘 예정된 상담 목록 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND DATE(c.scheduledAt) = DATE(:date) AND c.status IN ('APPROVED', 'IN_PROGRESS') ORDER BY c.scheduledAt ASC")
    List<Consultation> findTodayConsultationsByPbId(@Param("pbId") UUID pbId, @Param("date") LocalDateTime date);

    // 진행중인 상담 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status = 'IN_PROGRESS'")
    List<Consultation> findInProgressConsultationsByPbId(@Param("pbId") UUID pbId);

    // 완료된 상담 목록 조회 (평가 가능한 상담)
    @Query("SELECT c FROM Consultation c WHERE c.client.id = :clientId AND c.status = 'COMPLETED' AND c.clientRating IS NULL ORDER BY c.endedAt DESC")
    List<Consultation> findCompletedConsultationsForRating(@Param("clientId") UUID clientId);

    // PB의 상담 통계 조회
    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.pb.id = :pbId AND c.status = 'COMPLETED'")
    long countCompletedConsultationsByPbId(@Param("pbId") UUID pbId);

    @Query("SELECT AVG(c.clientRating) FROM Consultation c WHERE c.pb.id = :pbId AND c.clientRating IS NOT NULL")
    Double getAverageRatingByPbId(@Param("pbId") UUID pbId);

    // 특정 시간대에 예약된 상담이 있는지 확인
    @Query("SELECT COUNT(c) > 0 FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt = :scheduledAt AND c.status IN ('PENDING', 'APPROVED')")
    boolean existsByPbIdAndScheduledAt(@Param("pbId") UUID pbId, @Param("scheduledAt") LocalDateTime scheduledAt);

    // 시간대 충돌 확인을 위한 예약된 상담 조회
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND " +
           "c.status IN ('PENDING', 'APPROVED', 'IN_PROGRESS') AND " +
           "((c.scheduledAt <= :startTime AND c.scheduledAt > :startTime) OR " +
           "(c.scheduledAt < :endTime AND c.scheduledAt >= :endTime) OR " +
           "(c.scheduledAt >= :startTime AND c.scheduledAt <= :endTime))")
    List<Consultation> findConflictingConsultations(@Param("pbId") UUID pbId, 
                                                   @Param("startTime") LocalDateTime startTime, 
                                                   @Param("endTime") LocalDateTime endTime);

    // 최근 상담 목록 조회 (대시보드용)
    @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId ORDER BY c.createdAt DESC")
    Page<Consultation> findRecentConsultationsByPbId(@Param("pbId") UUID pbId, Pageable pageable);

    // 상담 유형별 통계
    @Query("SELECT c.consultationType, COUNT(c) FROM Consultation c WHERE c.pb.id = :pbId AND c.status = 'COMPLETED' GROUP BY c.consultationType")
    List<Object[]> getConsultationTypeStatistics(@Param("pbId") UUID pbId);

    // 월별 상담 통계
    @Query("SELECT YEAR(c.scheduledAt), MONTH(c.scheduledAt), COUNT(c) FROM Consultation c WHERE c.pb.id = :pbId AND c.status = 'COMPLETED' GROUP BY YEAR(c.scheduledAt), MONTH(c.scheduledAt) ORDER BY YEAR(c.scheduledAt) DESC, MONTH(c.scheduledAt) DESC")
    List<Object[]> getMonthlyConsultationStatistics(@Param("pbId") UUID pbId);
}
