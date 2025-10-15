package com.hanazoom.domain.chat.repository;

import com.hanazoom.domain.chat.document.RegionChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionChatMessageRepository extends MongoRepository<RegionChatMessage, String> {

    Page<RegionChatMessage> findByRegionIdOrderByCreatedAtDesc(Long regionId, Pageable pageable);

    List<RegionChatMessage> findTop100ByRegionIdOrderByCreatedAtDesc(Long regionId);

    Long countByRegionId(Long regionId);
}

