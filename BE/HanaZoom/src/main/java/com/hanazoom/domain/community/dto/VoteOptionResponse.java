package com.hanazoom.domain.community.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VoteOptionResponse {
    private String id;
    private String text;
    private int voteCount;
    private double percentage;
}
