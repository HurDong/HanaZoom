package com.hanazoom.domain.member.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KakaoLoginRequest {
    private String code;
    private String redirectUri;
}
