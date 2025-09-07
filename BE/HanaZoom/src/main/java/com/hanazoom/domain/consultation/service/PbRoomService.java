package com.hanazoom.domain.consultation.service;

import com.hanazoom.domain.consultation.dto.*;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PbRoomService {

    private final PbRoomRepository pbRoomRepository;
    private final PbRoomParticipantRepository participantRepository;
    private final MemberRepository memberRepository;

    /**
     * PB 방 생성
     */
    @Transactional
    public PbRoomResponseDto createRoom(UUID pbId, CreatePbRoomRequestDto requestDto) {
        log.info("PB 방 생성: pbId={}, roomName={}", pbId, requestDto.getRoomName());

        // PB 정보 조회
        Member pb = memberRepository.findById(pbId)
                .orElseThrow(() -> new IllegalArgumentException("PB 정보를 찾을 수 없습니다"));

        // PB가 이미 활성 방을 가지고 있는지 확인
        if (pbRoomRepository.existsByPbIdAndIsActiveTrue(pbId)) {
            throw new IllegalStateException("이미 활성화된 방이 있습니다. 기존 방을 비활성화한 후 새 방을 생성해주세요.");
        }

        // 초대 코드 생성
        String inviteCode = generateUniqueInviteCode();

        // 방 생성
        PbRoom room = PbRoom.builder()
                .pb(pb)
                .roomName(requestDto.getRoomName())
                .roomDescription(requestDto.getRoomDescription())
                .inviteCode(inviteCode)
                .isPrivate(requestDto.isPrivate())
                .roomPassword(requestDto.getRoomPassword())
                .maxParticipants(1) // 최대 1명의 게스트
                .currentParticipants(0)
                .isActive(true)
                .build();

        PbRoom savedRoom = pbRoomRepository.save(room);

        // PB를 방장으로 추가
        PbRoomParticipant host = PbRoomParticipant.builder()
                .room(savedRoom)
                .member(pb)
                .role(ParticipantRole.HOST)
                .isActive(true)
                .joinedAt(LocalDateTime.now())
                .clientSessionId("pb-" + UUID.randomUUID().toString().substring(0, 8))
                .build();

        participantRepository.save(host);

        log.info("PB 방 생성 완료: roomId={}, inviteCode={}", savedRoom.getId(), inviteCode);

        return convertToResponseDto(savedRoom);
    }

    /**
     * 방 참여 (회원용)
     */
    @Transactional
    public PbRoomResponseDto joinRoom(String inviteCode, String roomPassword, UUID memberId) {
        log.info("방 참여 시도: inviteCode={}, memberId={}", inviteCode, memberId);

        // 방 조회
        PbRoom room = pbRoomRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다"));

        if (!room.isActive()) {
            throw new IllegalStateException("비활성화된 방입니다");
        }

        // 비공개 방인 경우 비밀번호 확인
        if (room.isPrivate() && !room.getRoomPassword().equals(roomPassword)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }

        // 이미 참여 중인지 확인
        if (participantRepository.existsByRoomIdAndMemberIdAndIsActiveTrue(room.getId(), memberId)) {
            throw new IllegalStateException("이미 참여 중인 방입니다");
        }

        // 최대 참여자 수 확인
        if (room.getCurrentParticipants() >= room.getMaxParticipants()) {
            throw new IllegalStateException("방이 가득 찼습니다");
        }

        // 멤버 정보 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다"));

        // 참여자 추가
        PbRoomParticipant participant = PbRoomParticipant.builder()
                .room(room)
                .member(member)
                .role(ParticipantRole.GUEST)
                .isActive(true)
                .joinedAt(LocalDateTime.now())
                .build();

        participantRepository.save(participant);

        // 참여자 수 증가
        room.addParticipant();
        pbRoomRepository.save(room);

        log.info("방 참여 완료: roomId={}, memberId={}", room.getId(), memberId);

        return convertToResponseDto(room);
    }

    /**
     * 방 참여 (일반 사용자용 - 비로그인)
     */
    @Transactional
    public PbRoomResponseDto joinRoomAsGuest(String inviteCode, String roomPassword, UUID guestId) {
        log.info("일반 사용자 방 참여 시도: inviteCode={}, guestId={}", inviteCode, guestId);

        // 방 조회
        PbRoom room = pbRoomRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다"));

        if (!room.isActive()) {
            throw new IllegalStateException("비활성화된 방입니다");
        }

        // 비공개 방인 경우 비밀번호 확인
        if (room.isPrivate() && !room.getRoomPassword().equals(roomPassword)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }

        // 이미 참여 중인지 확인 (일반 사용자는 세션 기반으로 관리)
        if (participantRepository.existsByRoomIdAndClientSessionIdAndIsActiveTrue(room.getId(), guestId.toString())) {
            throw new IllegalStateException("이미 참여 중인 방입니다");
        }

        // 최대 참여자 수 확인
        if (room.getCurrentParticipants() >= room.getMaxParticipants()) {
            throw new IllegalStateException("방이 가득 찼습니다");
        }

        // 일반 사용자용 참여자 추가 (Member 없이)
        PbRoomParticipant participant = PbRoomParticipant.builder()
                .room(room)
                .member(null) // 일반 사용자는 Member 없음
                .role(ParticipantRole.GUEST)
                .isActive(true)
                .joinedAt(LocalDateTime.now())
                .clientSessionId(guestId.toString()) // 세션 ID로 관리
                .build();

        participantRepository.save(participant);

        // 참여자 수 증가
        room.addParticipant();
        pbRoomRepository.save(room);

        log.info("일반 사용자 방 참여 완료: roomId={}, guestId={}", room.getId(), guestId);

        return convertToResponseDto(room);
    }

    /**
     * 방 참여 (로그인한 일반 사용자용)
     */
    @Transactional
    public PbRoomResponseDto joinRoomAsLoggedInUser(String inviteCode, String roomPassword, UUID memberId) {
        log.info("로그인한 일반 사용자 방 참여 시도: inviteCode={}, memberId={}", inviteCode, memberId);

        // 방 조회
        PbRoom room = pbRoomRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다"));

        if (!room.isActive()) {
            throw new IllegalStateException("비활성화된 방입니다");
        }

        // 비공개 방인 경우 비밀번호 확인
        if (room.isPrivate() && !room.getRoomPassword().equals(roomPassword)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }

        // 임시: 이미 참여 중인지 확인 비활성화 (디버깅용)
        boolean exists = participantRepository.existsByRoomIdAndMemberIdAndIsActiveTrue(room.getId(), memberId);
        log.info("🔍 참여자 존재 여부 확인: roomId={}, memberId={}, exists={}", room.getId(), memberId, exists);

        if (exists) {
            log.warn("⚠️ 임시로 중복 참여 확인 비활성화 - 새로 참여자 등록: roomId={}, memberId={}", room.getId(), memberId);
            // throw new IllegalStateException("이미 참여 중인 방입니다"); // 주석 처리
        }

        // 최대 참여자 수 확인
        if (room.getCurrentParticipants() >= room.getMaxParticipants()) {
            throw new IllegalStateException("방이 가득 찼습니다");
        }

        // 멤버 정보 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다"));

        // 로그인한 사용자용 참여자 추가
        PbRoomParticipant participant = PbRoomParticipant.builder()
                .room(room)
                .member(member) // 실제 Member 사용
                .role(ParticipantRole.GUEST)
                .isActive(true)
                .joinedAt(LocalDateTime.now())
                .build();

        participantRepository.save(participant);

        // 참여자 수 증가
        room.addParticipant();
        pbRoomRepository.save(room);

        log.info("로그인한 일반 사용자 방 참여 완료: roomId={}, memberId={}", room.getId(), memberId);

        return convertToResponseDto(room);
    }

    /**
     * 방 나가기
     */
    @Transactional
    public void leaveRoom(UUID roomId, UUID memberId) {
        log.info("방 나가기: roomId={}, memberId={}", roomId, memberId);

        PbRoomParticipant participant = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("참여자 정보를 찾을 수 없습니다"));

        // 방장인 경우 방 비활성화
        if (participant.getRole() == ParticipantRole.HOST) {
            PbRoom room = participant.getRoom();
            room.deactivate();
            pbRoomRepository.save(room);
        } else {
            // 게스트인 경우 참여자 수 감소
            PbRoom room = participant.getRoom();
            room.removeParticipant();
            pbRoomRepository.save(room);
        }

        // 참여자 비활성화
        participant.leave();
        participantRepository.save(participant);

        log.info("방 나가기 완료: roomId={}, memberId={}", roomId, memberId);
    }

    /**
     * 참여자 강퇴
     */
    @Transactional
    public void kickParticipant(UUID roomId, UUID hostId, UUID participantId, String reason) {
        log.info("참여자 강퇴: roomId={}, hostId={}, participantId={}", roomId, hostId, participantId);

        // 방장 권한 확인
        PbRoomParticipant host = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, hostId)
                .orElseThrow(() -> new IllegalArgumentException("방장 정보를 찾을 수 없습니다"));

        if (host.getRole() != ParticipantRole.HOST) {
            throw new IllegalStateException("방장만 참여자를 강퇴할 수 있습니다");
        }

        // 강퇴할 참여자 조회
        PbRoomParticipant participant = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, participantId)
                .orElseThrow(() -> new IllegalArgumentException("강퇴할 참여자를 찾을 수 없습니다"));

        // 방장은 강퇴할 수 없음
        if (participant.getRole() == ParticipantRole.HOST) {
            throw new IllegalStateException("방장은 강퇴할 수 없습니다");
        }

        // 참여자 비활성화
        participant.leave();
        participantRepository.save(participant);

        // 참여자 수 감소
        PbRoom room = participant.getRoom();
        room.removeParticipant();
        pbRoomRepository.save(room);

        log.info("참여자 강퇴 완료: roomId={}, participantId={}, reason={}", roomId, participantId, reason);
    }

    /**
     * 초대 코드 재생성
     */
    @Transactional
    public String regenerateInviteCode(UUID roomId, UUID hostId) {
        log.info("초대 코드 재생성: roomId={}, hostId={}", roomId, hostId);

        // 방장 권한 확인
        PbRoomParticipant host = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, hostId)
                .orElseThrow(() -> new IllegalArgumentException("방장 정보를 찾을 수 없습니다"));

        if (host.getRole() != ParticipantRole.HOST) {
            throw new IllegalStateException("방장만 초대 코드를 재생성할 수 있습니다");
        }

        // 새로운 초대 코드 생성
        String newInviteCode = generateUniqueInviteCode();
        PbRoom room = host.getRoom();
        room.updateInviteCode(newInviteCode);
        pbRoomRepository.save(room);

        log.info("초대 코드 재생성 완료: roomId={}, newInviteCode={}", roomId, room.getInviteCode());

        return room.getInviteCode();
    }

    /**
     * 방 정보 조회
     */
    public PbRoomResponseDto getRoom(UUID roomId) {
        PbRoom room = pbRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다"));

        return convertToResponseDto(room);
    }

    /**
     * PB의 활성 방 조회
     */
    public PbRoomResponseDto getPbActiveRoom(UUID pbId) {
        PbRoom room = pbRoomRepository.findByPbIdAndIsActiveTrue(pbId)
                .orElseThrow(() -> new IllegalArgumentException("활성화된 방이 없습니다"));

        return convertToResponseDto(room);
    }

    /**
     * 활성 방 목록 조회
     */
    public List<PbRoomResponseDto> getActiveRooms() {
        log.info("활성 방 목록 조회");

        List<PbRoom> rooms = pbRoomRepository.findByIsActiveTrue();
        return rooms.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * 초대 코드로 방 정보 조회 (고객용)
     */
    public PbRoomResponseDto getRoomInfoByInviteCode(String inviteCode) {
        log.info("초대 코드로 방 정보 조회: inviteCode={}", inviteCode);

        PbRoom room = pbRoomRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다."));

        if (!room.isActive()) {
            throw new IllegalArgumentException("비활성화된 방입니다.");
        }

        return convertToResponseDto(room);
    }

    /**
     * 방 정보 업데이트
     */
    @Transactional
    public PbRoomResponseDto updateRoom(UUID roomId, UUID hostId, UpdateRoomRequestDto requestDto) {
        log.info("방 정보 업데이트: roomId={}, hostId={}", roomId, hostId);

        PbRoom room = pbRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다"));

        // 방장 권한 확인
        PbRoomParticipant host = participantRepository
                .findByRoomIdAndMemberIdAndIsActiveTrue(roomId, hostId)
                .orElseThrow(() -> new IllegalArgumentException("방장 정보를 찾을 수 없습니다"));

        if (host.getRole() != ParticipantRole.HOST) {
            throw new IllegalStateException("방장만 방 정보를 수정할 수 있습니다");
        }

        room.updateRoomInfo(
                requestDto.getRoomName(),
                requestDto.getRoomDescription(),
                requestDto.isPrivate(),
                requestDto.getRoomPassword());

        pbRoomRepository.save(room);

        log.info("방 정보 업데이트 완료: roomId={}", roomId);

        return convertToResponseDto(room);
    }

    /**
     * 고유한 초대 코드 생성
     */
    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = "PB" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (pbRoomRepository.findByInviteCode(inviteCode).isPresent());

        return inviteCode;
    }

    /**
     * 엔티티를 DTO로 변환
     */
    private PbRoomResponseDto convertToResponseDto(PbRoom room) {
        List<PbRoomResponseDto.ParticipantDto> participants = participantRepository
                .findByRoomIdAndIsActiveTrue(room.getId())
                .stream()
                .map(p -> {
                    // Member가 null인 경우 (일반 사용자) 처리
                    String memberId = p.getMember() != null ? p.getMember().getId().toString() : null;
                    String memberName = p.getMember() != null ? p.getMember().getName() : "게스트 사용자";

                    return PbRoomResponseDto.ParticipantDto.builder()
                            .participantId(p.getId().toString())
                            .memberId(memberId)
                            .memberName(memberName)
                            .role(p.getRole().name())
                            .joinedAt(p.getJoinedAt())
                            .isActive(p.isActive())
                            .build();
                })
                .collect(Collectors.toList());

        return PbRoomResponseDto.builder()
                .roomId(room.getId().toString())
                .pbId(room.getPb().getId().toString())
                .pbName(room.getPb().getName())
                .roomName(room.getRoomName())
                .roomDescription(room.getRoomDescription())
                .inviteCode(room.getInviteCode())
                .isActive(room.isActive())
                .maxParticipants(room.getMaxParticipants())
                .currentParticipants(room.getCurrentParticipants())
                .isPrivate(room.isPrivate())
                .lastActivityAt(room.getLastActivityAt())
                .createdAt(room.getCreatedAt())
                .participants(participants)
                .build();
    }
}