package com.hanazoom.domain.consultation.dto;

import com.hanazoom.domain.consultation.entity.PbRoom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PbRoomResponseDto {
    private String roomId;
    private String pbId;
    private String pbName;
    private String roomName;
    private String roomDescription;
    private String inviteCode;
    private boolean isActive;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private boolean isPrivate;
    private LocalDateTime lastActivityAt;
    private LocalDateTime createdAt;
    private List<ParticipantDto> participants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDto {
        private String participantId;
        private String memberId;
        private String memberName;
        private String role;
        private LocalDateTime joinedAt;
        private boolean isActive;
    }
}
