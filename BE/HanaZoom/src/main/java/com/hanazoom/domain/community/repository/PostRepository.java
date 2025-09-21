package com.hanazoom.domain.community.repository;

import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.stock.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

        Page<Post> findByStockAndIsDeletedFalseOrderByCreatedAtDesc(Stock stock, Pageable pageable);

        @Query("SELECT p FROM Post p WHERE p.stock = :stock AND p.isDeleted = false " +
                        "ORDER BY p.likeCount DESC, p.commentCount DESC, p.viewCount DESC")
        Page<Post> findTopPostsByStock(@Param("stock") Stock stock, Pageable pageable);

        @Query("SELECT COUNT(p) FROM Post p WHERE p.stock.id = :stockId AND p.isDeleted = false")
        int countByStockId(@Param("stockId") Long stockId);

        @Query("SELECT COALESCE(SUM(p.viewCount), 0) FROM Post p WHERE p.stock.id = :stockId AND p.isDeleted = false")
        int sumViewCountByStockId(@Param("stockId") Long stockId);
}