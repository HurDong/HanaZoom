package com.hanazoom.domain.consultation.repository;

import com.hanazoom.domain.consultation.entity.PbRoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PbRoomParticipantRepository extends JpaRepository<PbRoomParticipant, UUID> {


    List<PbRoomParticipant> findByRoomIdAndIsActiveTrue(UUID roomId);


    Optional<PbRoomParticipant> findByRoomIdAndMemberIdAndIsActiveTrue(UUID roomId, UUID memberId);


    List<PbRoomParticipant> findByRoomId(UUID roomId);


    List<PbRoomParticipant> findByMemberIdAndIsActiveTrue(UUID memberId);


    boolean existsByRoomIdAndRoleAndIsActiveTrue(UUID roomId,
            com.hanazoom.domain.consultation.entity.ParticipantRole role);


    @Query("SELECT COUNT(p) > 0 FROM PbRoomParticipant p WHERE p.room.id = :roomId AND p.member.id = :memberId AND p.isActive = true")
    boolean existsByRoomIdAndMemberIdAndIsActiveTrue(@Param("roomId") UUID roomId, @Param("memberId") UUID memberId);


    @Query("SELECT p FROM PbRoomParticipant p WHERE p.room.id = :roomId AND p.member.id = :memberId AND p.isActive = true")
    List<PbRoomParticipant> findParticipantsByRoomIdAndMemberIdAndIsActiveTrue(@Param("roomId") UUID roomId,
            @Param("memberId") UUID memberId);


    boolean existsByRoomIdAndClientSessionIdAndIsActiveTrue(UUID roomId, String clientSessionId);


    long countByRoomIdAndIsActiveTrue(UUID roomId);


    @Query("SELECT p FROM PbRoomParticipant p WHERE p.isActive = false AND p.leftAt < :cutoffTime")
    List<PbRoomParticipant> findInactiveParticipantsBefore(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);
}
