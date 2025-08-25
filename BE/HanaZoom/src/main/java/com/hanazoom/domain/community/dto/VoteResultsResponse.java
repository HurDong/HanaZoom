package com.hanazoom.domain.community.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class VoteResultsResponse {
    private List<VoteOptionResponse> voteOptions;
    private int totalVotes;
    private String userVote;
}
