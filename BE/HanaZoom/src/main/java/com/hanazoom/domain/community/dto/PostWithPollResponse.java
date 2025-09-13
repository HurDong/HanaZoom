package com.hanazoom.domain.community.dto;

import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.Poll;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostWithPollResponse {
    private Post post;
    private Poll poll;
}
