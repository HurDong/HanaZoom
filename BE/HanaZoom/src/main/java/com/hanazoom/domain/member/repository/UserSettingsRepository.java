package com.hanazoom.domain.member.repository;

import com.hanazoom.domain.member.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {
    
    Optional<UserSettings> findByMemberId(UUID memberId);
    
    boolean existsByMemberId(UUID memberId);
    
    void deleteByMemberId(UUID memberId);
}
