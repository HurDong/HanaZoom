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
    private String imageUrl;
    private PostType postType = PostType.TEXT; 
    private PostSentiment sentiment;
    private boolean hasVote = false; 
    private String voteQuestion;
    private java.util.List<String> voteOptions;
}