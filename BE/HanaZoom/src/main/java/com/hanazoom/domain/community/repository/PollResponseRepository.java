package com.hanazoom.domain.community.repository;

import com.hanazoom.domain.community.entity.Poll;
import com.hanazoom.domain.community.entity.PollResponse;
import com.hanazoom.domain.community.entity.Post;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PollResponseRepository extends JpaRepository<PollResponse, Long> {
    Optional<PollResponse> findByPollAndMember(Poll poll, Member member);

    boolean existsByPollAndMember(Poll poll, Member member);
}
