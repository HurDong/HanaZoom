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

    // 방 ID로 활성 참여자 조회
    List<PbRoomParticipant> findByRoomIdAndIsActiveTrue(UUID roomId);

    // 방 ID와 멤버 ID로 활성 참여자 조회
    Optional<PbRoomParticipant> findByRoomIdAndMemberIdAndIsActiveTrue(UUID roomId, UUID memberId);

    // 방 ID로 모든 참여자 조회 (비활성 포함)
    List<PbRoomParticipant> findByRoomId(UUID roomId);

    // 멤버 ID로 활성 참여자 조회
    List<PbRoomParticipant> findByMemberIdAndIsActiveTrue(UUID memberId);

    // 방에 특정 역할의 활성 참여자가 있는지 확인
    boolean existsByRoomIdAndRoleAndIsActiveTrue(UUID roomId,
            com.hanazoom.domain.consultation.entity.ParticipantRole role);

    // 방과 멤버로 활성 참여자 확인
    @Query("SELECT COUNT(p) > 0 FROM PbRoomParticipant p WHERE p.room.id = :roomId AND p.member.id = :memberId AND p.isActive = true")
    boolean existsByRoomIdAndMemberIdAndIsActiveTrue(@Param("roomId") UUID roomId, @Param("memberId") UUID memberId);

    // 디버깅용: 실제 참여자 조회
    @Query("SELECT p FROM PbRoomParticipant p WHERE p.room.id = :roomId AND p.member.id = :memberId AND p.isActive = true")
    List<PbRoomParticipant> findParticipantsByRoomIdAndMemberIdAndIsActiveTrue(@Param("roomId") UUID roomId,
            @Param("memberId") UUID memberId);

    // 방과 클라이언트 세션 ID로 활성 참여자 확인 (일반 사용자용)
    boolean existsByRoomIdAndClientSessionIdAndIsActiveTrue(UUID roomId, String clientSessionId);

    // 방의 활성 참여자 수 조회
    long countByRoomIdAndIsActiveTrue(UUID roomId);

    // 특정 시간 이후 비활성 참여자들 조회 (정리용)
    @Query("SELECT p FROM PbRoomParticipant p WHERE p.isActive = false AND p.leftAt < :cutoffTime")
    List<PbRoomParticipant> findInactiveParticipantsBefore(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);
}
