package com.hanazoom.domain.consultation.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "pb_rooms")
public class PbRoom {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pb_id", nullable = false, unique = true)
    private Member pb;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @Column(name = "room_description", columnDefinition = "TEXT")
    private String roomDescription;

    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants = 1; // 최대 1명

    @Column(name = "current_participants", nullable = false)
    private Integer currentParticipants = 0;

    @Column(name = "room_password")
    private String roomPassword;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate = false;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public PbRoom(Member pb, String roomName, String roomDescription,
            String inviteCode, boolean isPrivate, String roomPassword) {
        this.pb = pb;
        this.roomName = roomName;
        this.roomDescription = roomDescription;
        this.inviteCode = inviteCode;
        this.isPrivate = isPrivate;
        this.roomPassword = roomPassword;
        this.lastActivityAt = LocalDateTime.now();
    }

    // 방 활성화/비활성화
    public void activate() {
        this.isActive = true;
        this.lastActivityAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.isActive = false;
        this.currentParticipants = 0;
    }

    // 참여자 수 관리
    public boolean canJoin() {
        return isActive && currentParticipants < maxParticipants;
    }

    public void addParticipant() {
        if (canJoin()) {
            this.currentParticipants++;
            this.lastActivityAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("방이 가득 찼습니다.");
        }
    }

    public void removeParticipant() {
        if (currentParticipants > 0) {
            this.currentParticipants--;
            this.lastActivityAt = LocalDateTime.now();
        }
    }

    // 초대 코드 재생성
    public void regenerateInviteCode() {
        this.inviteCode = generateInviteCode();
        this.lastActivityAt = LocalDateTime.now();
    }

    // 초대 코드 업데이트
    public void updateInviteCode(String newInviteCode) {
        this.inviteCode = newInviteCode;
        this.lastActivityAt = LocalDateTime.now();
    }

    // 방 정보 업데이트
    public void updateRoomInfo(String roomName, String roomDescription, boolean isPrivate, String roomPassword) {
        this.roomName = roomName;
        this.roomDescription = roomDescription;
        this.isPrivate = isPrivate;
        this.roomPassword = roomPassword;
        this.lastActivityAt = LocalDateTime.now();
    }

    // 초대 코드 생성
    private String generateInviteCode() {
        return "PB" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // 방 상태 확인
    public boolean isEmpty() {
        return currentParticipants == 0;
    }

    public boolean isFull() {
        return currentParticipants >= maxParticipants;
    }

    // 비밀번호 확인
    public boolean checkPassword(String password) {
        if (roomPassword == null || roomPassword.isEmpty()) {
            return true; // 비밀번호가 없으면 자유 입장
        }
        return roomPassword.equals(password);
    }
}
