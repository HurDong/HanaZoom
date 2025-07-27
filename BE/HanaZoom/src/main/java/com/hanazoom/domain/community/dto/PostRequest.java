package com.hanazoom.domain.community.dto;

import com.hanazoom.domain.community.entity.PostSentiment;
import com.hanazoom.domain.community.entity.PostType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PostRequest {
    private String title;
    private String content;
    private PostType postType = PostType.TEXT; // 기본값 설정
    private PostSentiment sentiment;
}