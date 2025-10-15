package com.hanazoom.domain.community.repository;

import com.hanazoom.domain.community.entity.Poll;
import com.hanazoom.domain.community.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {
    Optional<Poll> findByPost(Post post);

    Optional<Poll> findByPostId(Long postId);

    @Query("SELECT p FROM Poll p LEFT JOIN FETCH p.pollOptions WHERE p.post.id = :postId")
    Optional<Poll> findByPostIdWithOptions(@Param("postId") Long postId);


    @Query("SELECT COUNT(p) FROM Poll p JOIN p.post post WHERE post.stock.id = :stockId")
    int countByStockId(@Param("stockId") Long stockId);
}
