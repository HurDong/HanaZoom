package com.hanazoom.domain.chat.service;

import com.hanazoom.domain.chat.document.RegionChatMessage;
import com.hanazoom.domain.chat.repository.RegionChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegionChatService {

    private final RegionChatMessageRepository chatMessageRepository;

    /**
     * 채팅 메시지를 MongoDB에 저장합니다.
     * ENTER, LEAVE, SYSTEM, WELCOME 메시지는 저장하지 않습니다.
     *
     * @param messageId       메시지 ID (UUID)
     * @param regionId        지역 ID
     * @param memberId        회원 ID (UUID)
     * @param memberName      회원 이름
     * @param content         메시지 내용
     * @param messageType     메시지 타입
     * @param images          이미지 리스트
     * @param imageCount      이미지 개수
     * @param portfolioStocks 보유종목 정보
     */
    public void saveChatMessage(
            String messageId,
            Long regionId,
            String memberId,
            String memberName,
            String content,
            String messageType,
            List<String> images,
            Integer imageCount,
            List<Map<String, Object>> portfolioStocks) {
        try {
            // ENTER, LEAVE, SYSTEM, WELCOME 메시지는 저장하지 않음 (임시 메시지)
            if ("ENTER".equals(messageType) || "LEAVE".equals(messageType) ||
                    "SYSTEM".equals(messageType) || "WELCOME".equals(messageType)) {
                return;
            }

            RegionChatMessage message = RegionChatMessage.builder()
                    .id(messageId)
                    .regionId(regionId)
                    .memberId(memberId)
                    .memberName(memberName)
                    .content(content)
                    .messageType(messageType)
                    .createdAt(LocalDateTime.now())
                    .images(images)
                    .imageCount(imageCount)
                    .portfolioStocks(portfolioStocks)
                    .build();

            chatMessageRepository.save(message);
            log.debug("💾 채팅 메시지 저장 완료: regionId={}, messageId={}, memberName={}",
                    regionId, messageId, memberName);

        } catch (Exception e) {
            log.error("❌ 채팅 메시지 저장 실패: regionId={}, messageId={}", regionId, messageId, e);
            // 메시지 저장 실패는 채팅 기능에 영향을 주지 않도록 예외를 무시합니다.
        }
    }

    /**
     * 특정 지역의 이전 채팅 메시지를 조회합니다.
     *
     * @param regionId 지역 ID
     * @param page     페이지 번호 (0부터 시작)
     * @param size     페이지 크기
     * @return 메시지 목록 (오래된 순으로 정렬)
     */
    public List<RegionChatMessage> getRecentMessages(Long regionId, int page, int size) {
        try {
            // 최신 메시지부터 조회한 후, 클라이언트에서 역순으로 표시
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<RegionChatMessage> messagePage = chatMessageRepository.findByRegionIdOrderByCreatedAtDesc(regionId,
                    pageable);

            // 메시지를 오래된 순으로 뒤집어서 반환 (채팅창에서는 오래된 메시지가 위에 표시)
            List<RegionChatMessage> messages = messagePage.getContent();
            Collections.reverse(messages);

            log.info("📥 채팅 메시지 조회 완료: regionId={}, page={}, size={}, totalMessages={}",
                    regionId, page, size, messages.size());

            return messages;

        } catch (Exception e) {
            log.error("❌ 채팅 메시지 조회 실패: regionId={}", regionId, e);
            return Collections.emptyList();
        }
    }

    /**
     * 특정 지역의 최근 N개 메시지를 조회합니다.
     *
     * @param regionId 지역 ID
     * @param limit    조회할 메시지 개수
     * @return 메시지 목록 (오래된 순으로 정렬)
     */
    public List<RegionChatMessage> getRecentMessages(Long regionId, int limit) {
        try {
            log.info("🔍 MongoDB 쿼리 시작: regionId={}, limit={}", regionId, limit);

            List<RegionChatMessage> messages = chatMessageRepository.findTop100ByRegionIdOrderByCreatedAtDesc(regionId);

            log.info("🔍 MongoDB 조회 결과: regionId={}, 조회된 메시지 수={}", regionId, messages.size());

            // 조회된 메시지 ID 로깅 (디버깅용)
            if (!messages.isEmpty()) {
                log.info("🔍 첫 번째 메시지 ID: {}, memberName: {}, content: {}",
                        messages.get(0).getId(),
                        messages.get(0).getMemberName(),
                        messages.get(0).getContent());
            } else {
                log.warn("⚠️ regionId={}에 대한 메시지가 MongoDB에 없습니다. MongoDB 연결 상태를 확인하세요.", regionId);
            }

            // limit 적용
            if (messages.size() > limit) {
                messages = messages.subList(0, limit);
            }

            // 메시지를 오래된 순으로 뒤집어서 반환
            Collections.reverse(messages);

            log.info("📥 최근 채팅 메시지 조회 완료: regionId={}, limit={}, actualSize={}",
                    regionId, limit, messages.size());

            return messages;

        } catch (Exception e) {
            log.error("❌ 최근 채팅 메시지 조회 실패: regionId={}, 에러: {}", regionId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 특정 지역의 총 메시지 개수를 조회합니다.
     *
     * @param regionId 지역 ID
     * @return 메시지 개수
     */
    public Long getMessageCount(Long regionId) {
        try {
            return chatMessageRepository.countByRegionId(regionId);
        } catch (Exception e) {
            log.error("❌ 메시지 개수 조회 실패: regionId={}", regionId, e);
            return 0L;
        }
    }
}
