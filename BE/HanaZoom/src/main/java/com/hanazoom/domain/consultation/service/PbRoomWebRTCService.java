package com.hanazoom.domain.consultation.service;

import com.hanazoom.domain.consultation.entity.PbRoom;
import com.hanazoom.domain.consultation.entity.PbRoomParticipant;
import com.hanazoom.domain.consultation.entity.ParticipantRole;
import com.hanazoom.domain.consultation.repository.PbRoomRepository;
import com.hanazoom.domain.consultation.repository.PbRoomParticipantRepository;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PbRoomWebRTCService {

    private final PbRoomRepository pbRoomRepository;
    private final PbRoomParticipantRepository participantRepository;
    private final MemberRepository memberRepository;

    /**
     * PB 방 생성 (단순화된 버전)
     */
    @Transactional
    public PbRoom createRoom(Member pb, String roomName) {
        log.info("PB 방 생성: pbId={}, roomName={}", pb.getId(), roomName);

        // PB가 이미 활성 방을 가지고 있는지 확인
        if (pbRoomRepository.existsByPbIdAndIsActiveTrue(pb.getId())) {
            throw new IllegalStateException("이미 활성화된 방이 있습니다. 기존 방을 비활성화한 후 새 방을 생성해주세요.");
        }

        // 방 생성
        PbRoom room = PbRoom.builder()
                .pb(pb)
                .roomName(roomName)
                .build();

        PbRoom savedRoom = pbRoomRepository.save(room);

        // PB를 HOST로 참여자 추가
        addParticipant(savedRoom, pb, ParticipantRole.HOST);

        log.info("PB 방 생성 완료: roomId={}", savedRoom.getId());
        return savedRoom;
    }

    /**
     * PB의 활성 방 조회
     */
    public PbRoom findActiveRoomByPbId(UUID pbId) {
        return pbRoomRepository.findByPbIdAndIsActiveTrue(pbId).orElse(null);
    }

    /**
     * 방 ID로 방 조회
     */
    public PbRoom findById(UUID roomId) {
        return pbRoomRepository.findById(roomId).orElse(null);
    }

    /**
     * 참여자 추가
     */
    @Transactional
    public PbRoomParticipant addParticipant(PbRoom room, Member member, ParticipantRole role) {
        log.info("참여자 추가: roomId={}, memberId={}, role={}", room.getId(), member.getId(), role);

        // 이미 참여 중인지 확인
        Optional<PbRoomParticipant> existingParticipant = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(room.getId(), member.getId());

        if (existingParticipant.isPresent()) {
            log.info("이미 참여 중인 사용자, 기존 참여자 정보 반환: {}", existingParticipant.get().getId());
            return existingParticipant.get();
        }

        PbRoomParticipant participant = new PbRoomParticipant(
                room,
                member,
                role,
                UUID.randomUUID().toString());

        return participantRepository.save(participant);
    }

    /**
     * 참여자 제거
     */
    @Transactional
    public void removeParticipant(UUID roomId, UUID memberId) {
        log.info("참여자 제거: roomId={}, memberId={}", roomId, memberId);

        PbRoomParticipant participant = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, memberId)
                .orElseThrow(() -> new IllegalStateException("참여자를 찾을 수 없습니다"));

        participant.leave();
        participantRepository.save(participant);

        // 방의 참여자 수 감소
        PbRoom room = pbRoomRepository.findById(roomId).orElse(null);
        if (room != null) {
            room.removeParticipant();
            pbRoomRepository.save(room);
        }
    }
}
