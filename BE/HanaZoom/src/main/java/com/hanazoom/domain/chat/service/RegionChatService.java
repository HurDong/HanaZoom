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

        }
    }

    public List<RegionChatMessage> getRecentMessages(Long regionId, int page, int size) {
        try {

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<RegionChatMessage> messagePage = chatMessageRepository.findByRegionIdOrderByCreatedAtDesc(regionId,
                    pageable);


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

    public List<RegionChatMessage> getRecentMessages(Long regionId, int limit) {
        try {
            List<RegionChatMessage> messages = chatMessageRepository.findTop100ByRegionIdOrderByCreatedAtDesc(regionId);


            if (messages.size() > limit) {
                messages = messages.subList(0, limit);
            }


            Collections.reverse(messages);

            log.info("📥 최근 채팅 메시지 조회 완료: regionId={}, limit={}, actualSize={}",
                    regionId, limit, messages.size());

            return messages;

        } catch (Exception e) {
            log.error("❌ 최근 채팅 메시지 조회 실패: regionId={}", regionId, e);
            return Collections.emptyList();
        }
    }

    public Long getMessageCount(Long regionId) {
        try {
            return chatMessageRepository.countByRegionId(regionId);
        } catch (Exception e) {
            log.error("❌ 메시지 개수 조회 실패: regionId={}", regionId, e);
            return 0L;
        }
    }
}

