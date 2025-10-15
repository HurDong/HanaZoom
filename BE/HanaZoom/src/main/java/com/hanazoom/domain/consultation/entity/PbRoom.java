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

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder.Default
    @Column(name = "current_participants", nullable = false)
    private Integer currentParticipants = 0;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public PbRoom(Member pb, String roomName) {
        this.pb = pb;
        this.roomName = roomName;
        this.currentParticipants = 0; 
        this.isActive = true; 
        this.lastActivityAt = LocalDateTime.now();
    }


    public void activate() {
        this.isActive = true;
        this.lastActivityAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.isActive = false;
        this.currentParticipants = 0;
    }


    public boolean canJoin() {
        return isActive && currentParticipants < 1; 
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


    public boolean isEmpty() {
        return currentParticipants == 0;
    }

    public boolean isFull() {
        return currentParticipants >= 1;
    }
}
