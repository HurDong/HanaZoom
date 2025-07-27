package com.hanazoom.domain.community.service;

import com.hanazoom.domain.community.entity.Comment;
import com.hanazoom.domain.community.entity.Like;
import com.hanazoom.domain.community.entity.LikeTargetType;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.community.repository.CommentRepository;
import com.hanazoom.domain.community.repository.LikeRepository;
import com.hanazoom.domain.member.entity.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;

    @Override
    @Transactional
    public Comment createComment(Post post, Member member, String content) {
        Comment comment = Comment.builder()
                .post(post)
                .member(member)
                .content(content)
                .build();
        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public Comment updateComment(Long commentId, Member member, String content) {
        Comment comment = getCommentWithMemberCheck(commentId, member);
        comment.update(content);
        return comment;
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Member member) {
        Comment comment = getCommentWithMemberCheck(commentId, member);
        comment.delete();
    }

    @Override
    public Page<Comment> getCommentsByPost(Post post, Pageable pageable) {
        return commentRepository.findByPostAndIsDeletedFalseOrderByCreatedAtDesc(post, pageable);
    }

    @Override
    @Transactional
    public void likeComment(Long commentId, Member member) {
        if (isLikedByMember(commentId, member)) {
            throw new IllegalArgumentException("이미 좋아요한 댓글입니다.");
        }
        Comment comment = getComment(commentId);
        comment.incrementLikeCount();
        likeRepository.save(Like.builder()
                .member(member)
                .targetType(LikeTargetType.COMMENT)
                .targetId(commentId)
                .build());
    }

    @Override
    @Transactional
    public void unlikeComment(Long commentId, Member member) {
        if (!isLikedByMember(commentId, member)) {
            throw new IllegalArgumentException("좋아요하지 않은 댓글입니다.");
        }
        Comment comment = getComment(commentId);
        comment.decrementLikeCount();
        likeRepository.deleteByMemberAndTargetTypeAndTargetId(member, LikeTargetType.COMMENT, commentId);
    }

    @Override
    public boolean isLikedByMember(Long commentId, Member member) {
        if (member == null)
            return false;
        return likeRepository.existsByMemberAndTargetTypeAndTargetId(member, LikeTargetType.COMMENT, commentId);
    }

    private Comment getComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
    }

    private Comment getCommentWithMemberCheck(Long commentId, Member member) {
        Comment comment = getComment(commentId);
        if (!comment.getMember().equals(member)) {
            throw new IllegalArgumentException("댓글 작성자만 수정/삭제할 수 있습니다.");
        }
        return comment;
    }
}