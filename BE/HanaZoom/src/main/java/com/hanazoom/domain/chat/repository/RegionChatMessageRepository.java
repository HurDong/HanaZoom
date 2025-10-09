package com.hanazoom.domain.chat.repository;

import com.hanazoom.domain.chat.document.RegionChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionChatMessageRepository extends MongoRepository<RegionChatMessage, String> {

    /**
     * 특정 지역의 최신 메시지 조회 (페이징)
     * 
     * @param regionId 지역 ID
     * @param pageable 페이징 정보
     * @return 메시지 페이지
     */
    Page<RegionChatMessage> findByRegionIdOrderByCreatedAtDesc(Long regionId, Pageable pageable);

    /**
     * 특정 지역의 최근 N개 메시지 조회
     * 
     * @param regionId 지역 ID
     * @return 메시지 목록 (최신순)
     */
    List<RegionChatMessage> findTop100ByRegionIdOrderByCreatedAtDesc(Long regionId);

    /**
     * 특정 지역의 메시지 개수 조회
     * 
     * @param regionId 지역 ID
     * @return 메시지 개수
     */
    Long countByRegionId(Long regionId);
}

