package com.hanazoom.domain.community.dto;

import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.entity.PostSentiment;
import com.hanazoom.domain.community.entity.PostType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

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
                    .avatar(null) // 현재는 avatar 기능이 없으므로 null 반환
                    .build();
        }
    }

    public static PostResponse from(Post post, boolean isLiked) {
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
                .build();
    }
}