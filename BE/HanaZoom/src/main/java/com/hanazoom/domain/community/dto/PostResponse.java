package com.hanazoom.domain.community.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.PostSentiment;
import com.hanazoom.domain.community.entity.PostType;
import com.hanazoom.domain.community.entity.Poll;
import com.hanazoom.domain.community.entity.PollOption;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class PostResponse {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private PostType postType;
    private PostSentiment sentiment;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private boolean isLiked;
    private AuthorResponse author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    @JsonProperty("hasVote")
    private boolean hasVote;
    @JsonProperty("voteQuestion")
    private String voteQuestion;
    @JsonProperty("voteOptions")
    private List<VoteOptionResponse> voteOptions;
    @JsonProperty("userVote")
    private String userVote;

    @Getter
    @Builder
    public static class AuthorResponse {
        private String id;
        private String name;
        private String avatar;

        public static AuthorResponse from(Post post) {
            return AuthorResponse.builder()
                    .id(post.getMember().getId().toString())
                    .name(post.getMember().getName())
                    .avatar(null) 
                    .build();
        }
    }

    @Getter
    @Builder
    public static class VoteOptionResponse {
        @JsonProperty("id")
        private String id;
        @JsonProperty("text")
        private String text;
        @JsonProperty("voteCount")
        private int voteCount;

        public static VoteOptionResponse from(PollOption pollOption) {
            return VoteOptionResponse.builder()
                    .id(pollOption.getId().toString())
                    .text(pollOption.getText())
                    .voteCount(0) 
                    .build();
        }
    }

    public static PostResponse from(Post post, boolean isLiked) {
        return from(post, isLiked, null, null);
    }

    public static PostResponse from(Post post, boolean isLiked, Poll poll, String userVote) {
        boolean hasVote = poll != null;
        String voteQuestion = hasVote ? poll.getQuestion() : null;
        List<VoteOptionResponse> voteOptions = null;

        

        if (hasVote) {


            voteOptions = List.of(
                    VoteOptionResponse.builder()
                            .id("UP")
                            .text(poll.getOptionUp())
                            .voteCount(poll.getVoteUpCount())
                            .build(),
                    VoteOptionResponse.builder()
                            .id("DOWN")
                            .text(poll.getOptionDown())
                            .voteCount(poll.getVoteDownCount())
                            .build());

            
        }

        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .postType(post.getPostType())
                .sentiment(post.getSentiment())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .isLiked(isLiked)
                .author(AuthorResponse.from(post))
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .hasVote(hasVote)
                .voteQuestion(voteQuestion)
                .voteOptions(voteOptions)
                .userVote(userVote)
                .build();
    }
}