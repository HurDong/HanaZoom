package com.hanazoom.domain.consultation.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "pb_room_participants")
public class PbRoomParticipant {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private PbRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = true)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ParticipantRole role;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "client_session_id")
    private String clientSessionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public PbRoomParticipant(PbRoom room, Member member, ParticipantRole role, String clientSessionId) {
        this.room = room;
        this.member = member;
        this.role = role;
        this.clientSessionId = clientSessionId;
        this.joinedAt = LocalDateTime.now();
    }


    public void leave() {
        this.isActive = false;
        this.leftAt = LocalDateTime.now();
    }


    public void kick() {
        this.isActive = false;
        this.leftAt = LocalDateTime.now();
    }


    public void rejoin() {
        this.isActive = true;
        this.leftAt = null;
    }


    public void updateSessionId(String sessionId) {
        this.clientSessionId = sessionId;
    }
}
