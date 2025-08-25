package com.hanazoom.domain.community.service;

import com.hanazoom.domain.community.entity.Comment;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentService {
    Comment createComment(Post post, Member member, String content);

    Comment createReply(Long parentCommentId, Member member, String content);

    Comment updateComment(Long commentId, Member member, String content);

    void deleteComment(Long commentId, Member member);

    Page<Comment> getCommentsByPost(Post post, Pageable pageable);

    Page<Comment> getTopLevelCommentsByPost(Post post, Pageable pageable);

    java.util.List<Comment> getRepliesByParentComment(Long parentCommentId);

    void likeComment(Long commentId, Member member);

    void unlikeComment(Long commentId, Member member);

    boolean isLikedByMember(Long commentId, Member member);
}