package com.hanazoom.domain.chat.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_messages_region_created", columnList = "region_id, created_at"),
    @Index(name = "idx_chat_messages_member_created", columnList = "member_id, created_at"),
    @Index(name = "idx_chat_messages_region", columnList = "region_id"),
    @Index(name = "idx_chat_messages_created", columnList = "created_at")
})
@Getter
@NoArgsConstructor
public class ChatMessage {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "region_id", nullable = false)
    private Long regionId;

    @Column(name = "member_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID memberId;

    @Column(name = "member_name", nullable = false, length = 100)
    private String memberName;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatMessage(Long regionId, UUID memberId, String memberName, String content, MessageType messageType) {
        this.regionId = regionId;
        this.memberId = memberId;
        this.memberName = memberName;
        this.content = content;
        this.messageType = messageType;
    }
}
