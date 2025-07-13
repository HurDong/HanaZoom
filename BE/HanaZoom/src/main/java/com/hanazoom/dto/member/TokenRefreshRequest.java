package com.hanazoom.dto.member;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class TokenRefreshRequest {
    @NotBlank(message = "Refresh Token은 필수 입력값입니다.")
    private String refreshToken;
}