package com.hanazoom.domain.member.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResetPasswordRequest {
    private String email;
    private String code;
    private String newPassword;
}
