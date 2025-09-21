package com.hanazoom.domain.community.repository;

import com.hanazoom.domain.community.entity.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
}
