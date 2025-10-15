package com.hanazoom.domain.community.dto;

import com.hanazoom.domain.community.entity.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private AuthorResponse author;
    private int likeCount;
    private boolean isLiked;
    private Long parentCommentId;
    private int depth;

    @Getter
    @Builder
    public static class AuthorResponse {
        private String id;
        private String name;
        private String avatar;

        public static AuthorResponse from(Comment comment) {
            return AuthorResponse.builder()
                    .id(comment.getMember().getId().toString())
                    .name(comment.getMember().getName())
                    .avatar(null) 
                    .build();
        }
    }

    public static CommentResponse from(Comment comment, boolean isLiked) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .author(AuthorResponse.from(comment))
                .likeCount(comment.getLikeCount())
                .isLiked(isLiked)
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .depth(comment.getDepth())
                .build();
    }
}