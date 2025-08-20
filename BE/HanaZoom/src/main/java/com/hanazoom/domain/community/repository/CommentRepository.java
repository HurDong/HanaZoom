package com.hanazoom.domain.community.repository;

import com.hanazoom.domain.community.entity.Comment;
import com.hanazoom.domain.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

        // 특정 게시글의 댓글 목록 조회 (페이징) - 최상위 댓글만
        Page<Comment> findByPostAndIsDeletedFalseAndDepthOrderByCreatedAtDesc(Post post, int depth, Pageable pageable);

        // 특정 게시글의 모든 댓글 목록 조회 (계층형)
        Page<Comment> findByPostAndIsDeletedFalseOrderByCreatedAtDesc(Post post, Pageable pageable);

        // 특정 부모 댓글의 대댓글 목록 조회
        @Query("SELECT c FROM Comment c WHERE c.parentComment = :parentComment AND c.isDeleted = false ORDER BY c.createdAt ASC")
        List<Comment> findRepliesByParentComment(@Param("parentComment") Comment parentComment);

        // 특정 게시글의 인기 댓글 목록 조회 (좋아요 순)
        @Query("SELECT c FROM Comment c WHERE c.post = :post AND c.isDeleted = false " +
                        "ORDER BY c.likeCount DESC, c.createdAt DESC")
        List<Comment> findTopCommentsByPost(@Param("post") Post post, Pageable pageable);

        // 특정 기간 동안의 댓글 수 조회
        long countByPostAndCreatedAtBetweenAndIsDeletedFalse(
                        Post post, LocalDateTime start, LocalDateTime end);

        // 특정 게시글의 전체 댓글 수 조회
        long countByPostAndIsDeletedFalse(Post post);
}