package com.hanazoom.domain.consultation.repository;

import com.hanazoom.domain.consultation.entity.Consultation;
import com.hanazoom.domain.consultation.entity.ConsultationStatus;
import com.hanazoom.domain.consultation.entity.ConsultationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {


        @Query("SELECT c FROM Consultation c WHERE c.client.id = :clientId ORDER BY c.scheduledAt DESC")
        Page<Consultation> findByClientId(@Param("clientId") UUID clientId, Pageable pageable);


        Optional<Consultation> findByPbIdAndScheduledAtAndStatus(UUID pbId, LocalDateTime scheduledAt,
                        ConsultationStatus status);


        List<Consultation> findByPbIdAndScheduledAtBetweenAndStatus(UUID pbId, LocalDateTime start, LocalDateTime end,
                        ConsultationStatus status);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId ORDER BY c.scheduledAt DESC")
        Page<Consultation> findByPbId(@Param("pbId") UUID pbId, Pageable pageable);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status ORDER BY c.scheduledAt ASC")
        List<Consultation> findByPbIdAndStatus(@Param("pbId") UUID pbId, @Param("status") ConsultationStatus status);


        @Query("SELECT c FROM Consultation c WHERE c.client.id = :clientId AND c.status = :status ORDER BY c.scheduledAt DESC")
        List<Consultation> findByClientIdAndStatus(@Param("clientId") UUID clientId,
                        @Param("status") ConsultationStatus status);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status != :unavailableStatus ORDER BY c.client.id, c.scheduledAt DESC")
        List<Consultation> findDistinctClientsByPbId(@Param("pbId") UUID pbId,
                        @Param("unavailableStatus") ConsultationStatus unavailableStatus);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.client.id = :clientId AND c.status IN :statuses")
        List<Consultation> findByPbIdAndClientIdAndStatusIn(@Param("pbId") UUID pbId, @Param("clientId") UUID clientId,
                        @Param("statuses") List<ConsultationStatus> statuses);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt BETWEEN :startDate AND :endDate ORDER BY c.scheduledAt ASC")
        List<Consultation> findByPbIdAndScheduledAtBetween(@Param("pbId") UUID pbId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt BETWEEN :startDate AND :endDate AND c.status IN :statuses ORDER BY c.scheduledAt ASC")
        List<Consultation> findBookedConsultationsByPbIdAndScheduledAtBetween(@Param("pbId") UUID pbId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("statuses") List<ConsultationStatus> statuses);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt >= :startDate ORDER BY c.scheduledAt ASC")
        List<Consultation> findByPbIdAndScheduledAtAfter(@Param("pbId") UUID pbId,
                        @Param("startDate") LocalDateTime startDate);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt <= :endDate ORDER BY c.scheduledAt ASC")
        List<Consultation> findByPbIdAndScheduledAtBefore(@Param("pbId") UUID pbId,
                        @Param("endDate") LocalDateTime endDate);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.consultationType = :type ORDER BY c.scheduledAt DESC")
        Page<Consultation> findByPbIdAndConsultationType(@Param("pbId") UUID pbId,
                        @Param("type") ConsultationType type,
                        Pageable pageable);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status ORDER BY c.createdAt ASC")
        List<Consultation> findPendingConsultationsByPbId(@Param("pbId") UUID pbId,
                        @Param("status") ConsultationStatus status);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND DATE(c.scheduledAt) = DATE(:date) AND c.status IN :statuses ORDER BY c.scheduledAt ASC")
        List<Consultation> findTodayConsultationsByPbId(@Param("pbId") UUID pbId, @Param("date") LocalDateTime date,
                        @Param("statuses") List<ConsultationStatus> statuses);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status")
        List<Consultation> findInProgressConsultationsByPbId(@Param("pbId") UUID pbId,
                        @Param("status") ConsultationStatus status);


        @Query("SELECT c FROM Consultation c WHERE c.client.id = :clientId AND c.status = :status AND c.clientRating IS NULL ORDER BY c.endedAt DESC")
        List<Consultation> findCompletedConsultationsForRating(@Param("clientId") UUID clientId,
                        @Param("status") ConsultationStatus status);


        @Query("SELECT COUNT(c) FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status")
        long countCompletedConsultationsByPbId(@Param("pbId") UUID pbId, @Param("status") ConsultationStatus status);

        @Query("SELECT AVG(c.clientRating) FROM Consultation c WHERE c.pb.id = :pbId AND c.clientRating IS NOT NULL")
        Double getAverageRatingByPbId(@Param("pbId") UUID pbId);


        @Query("SELECT COUNT(c) > 0 FROM Consultation c WHERE c.pb.id = :pbId AND c.scheduledAt = :scheduledAt AND c.status IN :statuses")
        boolean existsByPbIdAndScheduledAt(@Param("pbId") UUID pbId, @Param("scheduledAt") LocalDateTime scheduledAt,
                        @Param("statuses") List<ConsultationStatus> statuses);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId AND " +
                        "c.status IN :statuses AND " +
                        "((c.scheduledAt <= :startTime AND c.scheduledAt > :startTime) OR " +
                        "(c.scheduledAt < :endTime AND c.scheduledAt >= :endTime) OR " +
                        "(c.scheduledAt >= :startTime AND c.scheduledAt <= :endTime))")
        List<Consultation> findConflictingConsultations(@Param("pbId") UUID pbId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("statuses") List<ConsultationStatus> statuses);


        @Query("SELECT c FROM Consultation c WHERE c.pb.id = :pbId ORDER BY c.createdAt DESC")
        Page<Consultation> findRecentConsultationsByPbId(@Param("pbId") UUID pbId, Pageable pageable);


        @Query("SELECT c.consultationType, COUNT(c) FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status GROUP BY c.consultationType")
        List<Object[]> getConsultationTypeStatistics(@Param("pbId") UUID pbId,
                        @Param("status") ConsultationStatus status);


        @Query("SELECT YEAR(c.scheduledAt), MONTH(c.scheduledAt), COUNT(c) FROM Consultation c WHERE c.pb.id = :pbId AND c.status = :status GROUP BY YEAR(c.scheduledAt), MONTH(c.scheduledAt) ORDER BY YEAR(c.scheduledAt) DESC, MONTH(c.scheduledAt) DESC")
        List<Object[]> getMonthlyConsultationStatistics(@Param("pbId") UUID pbId,
                        @Param("status") ConsultationStatus status);
}
