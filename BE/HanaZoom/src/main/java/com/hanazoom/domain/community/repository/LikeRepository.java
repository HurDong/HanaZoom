package com.hanazoom.domain.community.repository;

import com.hanazoom.domain.community.entity.Like;
import com.hanazoom.domain.community.entity.LikeTargetType;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {
    boolean existsByMemberAndTargetTypeAndTargetId(Member member, LikeTargetType targetType, Long targetId);

    void deleteByMemberAndTargetTypeAndTargetId(Member member, LikeTargetType targetType, Long targetId);
}