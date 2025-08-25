package com.hanazoom.domain.member.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberInfoResponse {
    private UUID id;
    private String email;
    private String name;
    private String phone;
    private String address;
    private String detailAddress;
    private String zonecode;
    private Double latitude;
    private Double longitude;
    private Long regionId;
}
