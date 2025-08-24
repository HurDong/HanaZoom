package com.hanazoom.domain.member.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LocationUpdateRequest {
    private String address;
    private String detailAddress;
    private String zonecode;
    private Double latitude;
    private Double longitude;
}
