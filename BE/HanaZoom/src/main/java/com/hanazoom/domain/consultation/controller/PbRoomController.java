package com.hanazoom.domain.consultation.controller;

import com.hanazoom.domain.consultation.dto.*;
import com.hanazoom.domain.consultation.service.PbRoomService;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/pb-rooms")
@RequiredArgsConstructor
@Slf4j
public class PbRoomController {

    private final PbRoomService pbRoomService;
    private final MemberRepository memberRepository;

    /**
     * PB 방 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> createRoom(
            @RequestBody CreatePbRoomRequestDto requestDto) {

        UUID pbId = getCurrentUserId();
        log.info("PB 방 생성 요청: pbId={}, roomName={}", pbId, requestDto.getRoomName());

        PbRoomResponseDto room = pbRoomService.createRoom(pbId, requestDto);

        return ResponseEntity.ok(ApiResponse.success(room, "PB 방이 생성되었습니다"));
    }

    /**
     * 초대 코드로 방 참여 (PB용)
     */
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> joinRoom(
            @RequestBody JoinRoomRequestDto requestDto) {

        UUID memberId = getCurrentUserId();
        log.info("방 참여 요청: inviteCode={}, memberId={}", requestDto.getInviteCode(), memberId);

        PbRoomResponseDto room = pbRoomService.joinRoom(
                requestDto.getInviteCode(),
                requestDto.getRoomPassword(),
                memberId);

        return ResponseEntity.ok(ApiResponse.success(room, "방에 참여했습니다"));
    }

    /**
     * 초대 코드로 방 참여 (로그인한 일반 사용자용)
     */
    @PostMapping("/user/join")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> joinRoomAsLoggedInUser(
            @RequestBody JoinRoomRequestDto requestDto) {

        UUID memberId = getCurrentUserId();
        log.info("로그인한 일반 사용자 방 참여 요청: inviteCode={}, memberId={}", requestDto.getInviteCode(), memberId);

        PbRoomResponseDto room = pbRoomService.joinRoomAsLoggedInUser(
                requestDto.getInviteCode(),
                requestDto.getRoomPassword(),
                memberId);

        return ResponseEntity.ok(ApiResponse.success(room, "방에 참여했습니다"));
    }

    /**
     * 방 나가기
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveRoom(@PathVariable String roomId) {
        UUID memberId = getCurrentUserId();
        log.info("방 나가기 요청: roomId={}, memberId={}", roomId, memberId);

        pbRoomService.leaveRoom(UUID.fromString(roomId), memberId);

        return ResponseEntity.ok(ApiResponse.success(null, "방에서 나갔습니다"));
    }

    /**
     * 참여자 강퇴 (방장만 가능)
     */
    @PostMapping("/{roomId}/kick")
    public ResponseEntity<ApiResponse<Void>> kickParticipant(
            @PathVariable String roomId,
            @RequestBody KickParticipantRequestDto requestDto) {

        UUID hostId = getCurrentUserId();
        log.info("참여자 강퇴 요청: roomId={}, hostId={}, participantId={}",
                roomId, hostId, requestDto.getParticipantId());

        pbRoomService.kickParticipant(
                UUID.fromString(roomId),
                hostId,
                UUID.fromString(requestDto.getParticipantId()),
                requestDto.getReason());

        return ResponseEntity.ok(ApiResponse.success(null, "참여자를 강퇴했습니다"));
    }

    /**
     * 초대 코드 재생성
     */
    @PostMapping("/{roomId}/regenerate-invite-code")
    public ResponseEntity<ApiResponse<String>> regenerateInviteCode(@PathVariable String roomId) {
        UUID hostId = getCurrentUserId();
        log.info("초대 코드 재생성 요청: roomId={}, hostId={}", roomId, hostId);

        String newInviteCode = pbRoomService.regenerateInviteCode(UUID.fromString(roomId), hostId);

        return ResponseEntity.ok(ApiResponse.success(newInviteCode, "초대 코드가 재생성되었습니다"));
    }

    /**
     * 방 정보 조회
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> getRoom(@PathVariable String roomId) {
        log.info("방 정보 조회: roomId={}", roomId);

        PbRoomResponseDto room = pbRoomService.getRoom(UUID.fromString(roomId));

        return ResponseEntity.ok(ApiResponse.success(room, "방 정보를 조회했습니다"));
    }

    /**
     * PB의 활성 방 조회
     */
    @GetMapping("/my-room")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> getMyRoom() {
        UUID pbId = getCurrentUserId();
        log.info("내 방 조회: pbId={}", pbId);

        PbRoomResponseDto room = pbRoomService.getPbActiveRoom(pbId);

        return ResponseEntity.ok(ApiResponse.success(room, "내 방 정보를 조회했습니다"));
    }

    /**
     * 활성 방 목록 조회
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PbRoomResponseDto>>> getActiveRooms() {
        log.info("활성 방 목록 조회");

        List<PbRoomResponseDto> rooms = pbRoomService.getActiveRooms();

        return ResponseEntity.ok(ApiResponse.success(rooms, "활성 방 목록을 조회했습니다"));
    }

    /**
     * 초대 코드로 방 정보 조회 (고객용)
     */
    @GetMapping("/join-info")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> getRoomInfoByInviteCode(
            @RequestParam String inviteCode) {
        log.info("초대 코드로 방 정보 조회: inviteCode={}", inviteCode);

        PbRoomResponseDto room = pbRoomService.getRoomInfoByInviteCode(inviteCode);

        return ResponseEntity.ok(ApiResponse.success(room, "방 정보를 조회했습니다"));
    }

    /**
     * 방 정보 업데이트
     */
    @PutMapping("/{roomId}")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> updateRoom(
            @PathVariable String roomId,
            @RequestBody UpdateRoomRequestDto requestDto) {

        UUID hostId = getCurrentUserId();
        log.info("방 정보 업데이트: roomId={}, hostId={}", roomId, hostId);

        PbRoomResponseDto room = pbRoomService.updateRoom(
                UUID.fromString(roomId),
                hostId,
                requestDto);

        return ResponseEntity.ok(ApiResponse.success(room, "방 정보가 업데이트되었습니다"));
    }

    /**
     * PB의 활성 방 조회
     */
    @GetMapping("/pb/{pbId}/active")
    public ResponseEntity<ApiResponse<PbRoomResponseDto>> getPbActiveRoom(@PathVariable UUID pbId) {
        log.info("PB 활성 방 조회: pbId={}", pbId);

        try {
            PbRoomResponseDto room = pbRoomService.getPbActiveRoom(pbId);
            return ResponseEntity.ok(ApiResponse.success(room));
        } catch (IllegalArgumentException e) {
            log.warn("활성화된 방이 없습니다: pbId={}", pbId);
            return ResponseEntity.ok(ApiResponse.error("활성화된 방이 없습니다"));
        } catch (Exception e) {
            log.error("PB 활성 방 조회 실패: pbId={}", pbId, e);
            return ResponseEntity.status(500).body(ApiResponse.error("방 조회 중 오류가 발생했습니다"));
        }
    }

    /**
     * 현재 사용자 ID 가져오기 (JWT에서 추출)
     */
    private UUID getCurrentUserId() {
        // JWT에서 실제 사용자 ID를 추출하는 로직
        try {
            // SecurityContext에서 인증된 사용자 정보 가져오기
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String username = userDetails.getUsername();

                // 사용자명으로 Member 조회
                Optional<Member> member = memberRepository.findByEmail(username);
                if (member.isPresent()) {
                    UUID userId = member.get().getId();
                    log.info("JWT에서 사용자 ID 추출: {}", userId);
                    return userId;
                }
            }

            // JWT에서 사용자 ID를 가져올 수 없는 경우
            log.warn("JWT에서 사용자 ID를 가져올 수 없습니다. 인증 정보를 확인해주세요.");
            throw new IllegalStateException("인증된 사용자 정보를 찾을 수 없습니다");

        } catch (Exception e) {
            log.error("사용자 ID를 가져올 수 없습니다.", e);
            throw new IllegalStateException("사용자 인증에 실패했습니다");
        }
    }
}