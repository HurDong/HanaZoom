package com.hanazoom.domain.chat.repository;

import com.hanazoom.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {


    Page<ChatMessage> findByRegionIdOrderByCreatedAtDesc(Long regionId, Pageable pageable);


    List<ChatMessage> findTop50ByRegionIdOrderByCreatedAtDesc(Long regionId);
}
