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

    // PB ID로 방 조회
    Optional<PbRoom> findByPbId(UUID pbId);

    // 활성 방 목록 조회
    List<PbRoom> findByIsActiveTrueOrderByLastActivityAtDesc();

    // 활성 방 목록 조회 (간단한 버전)
    List<PbRoom> findByIsActiveTrue();

    // 특정 PB의 활성 방 조회
    Optional<PbRoom> findByPbIdAndIsActiveTrue(UUID pbId);

    // 방 이름으로 검색
    @Query("SELECT r FROM PbRoom r WHERE r.roomName LIKE %:roomName% AND r.isActive = true")
    List<PbRoom> findByRoomNameContaining(@Param("roomName") String roomName);

    // PB가 방을 가지고 있는지 확인
    boolean existsByPbIdAndIsActiveTrue(UUID pbId);

    // 특정 시간 이후 비활성 방들 조회 (정리용)
    @Query("SELECT r FROM PbRoom r WHERE r.isActive = false AND r.lastActivityAt < :cutoffTime")
    List<PbRoom> findInactiveRoomsBefore(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);
}
