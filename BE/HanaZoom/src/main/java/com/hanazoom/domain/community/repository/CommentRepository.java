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

        Page<Comment> findByPostAndIsDeletedFalseAndDepthOrderByCreatedAtDesc(Post post, int depth, Pageable pageable);

        Page<Comment> findByPostAndIsDeletedFalseOrderByCreatedAtDesc(Post post, Pageable pageable);

        @Query("SELECT c FROM Comment c WHERE c.parentComment = :parentComment AND c.isDeleted = false ORDER BY c.createdAt ASC")
        List<Comment> findRepliesByParentComment(@Param("parentComment") Comment parentComment);

        @Query("SELECT c FROM Comment c WHERE c.post = :post AND c.isDeleted = false " +
                        "ORDER BY c.likeCount DESC, c.createdAt DESC")
        List<Comment> findTopCommentsByPost(@Param("post") Post post, Pageable pageable);

        long countByPostAndCreatedAtBetweenAndIsDeletedFalse(
                        Post post, LocalDateTime start, LocalDateTime end);

        long countByPostAndIsDeletedFalse(Post post);

        @Query("SELECT COUNT(c) FROM Comment c JOIN c.post p WHERE p.stock.id = :stockId AND c.isDeleted = false")
        int countByStockId(@Param("stockId") Long stockId);
}