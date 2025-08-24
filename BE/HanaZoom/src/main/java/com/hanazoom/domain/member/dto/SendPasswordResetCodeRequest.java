package com.hanazoom.domain.member.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SendPasswordResetCodeRequest {
    private String email;
}
