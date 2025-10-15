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
                .parentComment(null)
                .depth(0)
                .build();
        Comment savedComment = commentRepository.save(comment);
        
        post.incrementCommentCount();
        
        return savedComment;
    }

    @Override
    @Transactional
    public Comment createReply(Long parentCommentId, Member member, String content) {
        Comment parentComment = getComment(parentCommentId);

        if (parentComment.getDepth() >= 1) {
            throw new IllegalArgumentException("대댓글에는 답글을 달 수 없습니다.");
        }

        Comment reply = Comment.builder()
                .post(parentComment.getPost())
                .member(member)
                .content(content)
                .parentComment(parentComment)
                .depth(parentComment.getDepth() + 1)
                .build();

        Comment savedReply = commentRepository.save(reply);
        
        parentComment.getPost().incrementCommentCount();
        
        return savedReply;
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
        
        comment.getPost().decrementCommentCount();
    }

    @Override
    public Page<Comment> getCommentsByPost(Post post, Pageable pageable) {
        return commentRepository.findByPostAndIsDeletedFalseOrderByCreatedAtDesc(post, pageable);
    }

    @Override
    public Page<Comment> getTopLevelCommentsByPost(Post post, Pageable pageable) {
        return commentRepository.findByPostAndIsDeletedFalseAndDepthOrderByCreatedAtDesc(post, 0, pageable);
    }

    @Override
    public java.util.List<Comment> getRepliesByParentComment(Long parentCommentId) {
        Comment parentComment = getComment(parentCommentId);
        return commentRepository.findRepliesByParentComment(parentComment);
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