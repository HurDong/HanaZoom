package com.hanazoom.domain.consultation.service;

import com.hanazoom.domain.consultation.entity.PbRoom;
import com.hanazoom.domain.consultation.entity.PbRoomParticipant;
import com.hanazoom.domain.consultation.entity.ParticipantRole;
import com.hanazoom.domain.consultation.repository.PbRoomRepository;
import com.hanazoom.domain.consultation.repository.PbRoomParticipantRepository;
import com.hanazoom.domain.member.entity.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PbRoomWebRTCService {

    private final PbRoomRepository pbRoomRepository;
    private final PbRoomParticipantRepository participantRepository;

    @Transactional
    public PbRoom createRoom(Member pb, String roomName) {
        log.info("PB 방 생성: pbId={}, roomName={}", pb.getId(), roomName);


        if (pbRoomRepository.existsByPbIdAndIsActiveTrue(pb.getId())) {
            throw new IllegalStateException("이미 활성화된 방이 있습니다. 기존 방을 비활성화한 후 새 방을 생성해주세요.");
        }


        PbRoom room = PbRoom.builder()
                .pb(pb)
                .roomName(roomName)
                .build();

        PbRoom savedRoom = pbRoomRepository.save(room);


        addParticipant(savedRoom, pb, ParticipantRole.HOST);

        log.info("PB 방 생성 완료: roomId={}", savedRoom.getId());
        return savedRoom;
    }

    public PbRoom findActiveRoomByPbId(UUID pbId) {
        return pbRoomRepository.findByPbIdAndIsActiveTrue(pbId).orElse(null);
    }

    public PbRoom findById(UUID roomId) {
        return pbRoomRepository.findById(roomId).orElse(null);
    }

    @Transactional
    public PbRoomParticipant addParticipant(PbRoom room, Member member, ParticipantRole role) {
        log.info("참여자 추가: roomId={}, memberId={}, role={}", room.getId(), member.getId(), role);


        List<PbRoomParticipant> existingParticipants = participantRepository
                .findParticipantsByRoomIdAndMemberIdAndIsActiveTrue(room.getId(), member.getId());

        if (!existingParticipants.isEmpty()) {
            if (existingParticipants.size() > 1) {
                log.warn("중복된 참여자 레코드 발견: roomId={}, memberId={}, count={}", 
                        room.getId(), member.getId(), existingParticipants.size());
                

                PbRoomParticipant activeParticipant = existingParticipants.get(0);
                for (int i = 1; i < existingParticipants.size(); i++) {
                    PbRoomParticipant duplicate = existingParticipants.get(i);
                    duplicate.leave();
                    participantRepository.save(duplicate);
                    log.info("중복 참여자 레코드 비활성화: {}", duplicate.getId());
                }
                
                log.info("기존 참여자 정보 반환: {}", activeParticipant.getId());
                return activeParticipant;
            } else {
                log.info("이미 참여 중인 사용자, 기존 참여자 정보 반환: {}", existingParticipants.get(0).getId());
                return existingParticipants.get(0);
            }
        }

        PbRoomParticipant participant = new PbRoomParticipant(
                room,
                member,
                role,
                UUID.randomUUID().toString());

        return participantRepository.save(participant);
    }

    @Transactional
    public void removeParticipant(UUID roomId, UUID memberId) {
        log.info("참여자 제거: roomId={}, memberId={}", roomId, memberId);

        PbRoomParticipant participant = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, memberId)
                .orElseThrow(() -> new IllegalStateException("참여자를 찾을 수 없습니다"));

        participant.leave();
        participantRepository.save(participant);


        PbRoom room = pbRoomRepository.findById(roomId).orElse(null);
        if (room != null) {
            room.removeParticipant();
            pbRoomRepository.save(room);
        }
    }
}
