package com.hanazoom.domain.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePbRoomRequestDto {
    private String roomName;
    private String roomDescription;
    private boolean isPrivate;
    private String roomPassword;
}

