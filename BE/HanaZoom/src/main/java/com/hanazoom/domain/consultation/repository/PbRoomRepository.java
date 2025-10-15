package com.hanazoom.domain.consultation.repository;

import com.hanazoom.domain.consultation.entity.PbRoom;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PbRoomRepository extends JpaRepository<PbRoom, UUID> {


    Optional<PbRoom> findByPbId(UUID pbId);


    List<PbRoom> findByIsActiveTrueOrderByLastActivityAtDesc();


    List<PbRoom> findByIsActiveTrue();


    Optional<PbRoom> findByPbIdAndIsActiveTrue(UUID pbId);


    @Query("SELECT r FROM PbRoom r WHERE r.roomName LIKE %:roomName% AND r.isActive = true")
    List<PbRoom> findByRoomNameContaining(@Param("roomName") String roomName);


    boolean existsByPbIdAndIsActiveTrue(UUID pbId);


    @Query("SELECT r FROM PbRoom r WHERE r.isActive = false AND r.lastActivityAt < :cutoffTime")
    List<PbRoom> findInactiveRoomsBefore(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);
}
