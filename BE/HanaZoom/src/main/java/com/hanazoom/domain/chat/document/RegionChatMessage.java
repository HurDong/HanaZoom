package com.hanazoom.domain.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Document(collection = "region_chat_messages")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionChatMessage {

    @Id
    private String id; // MongoDB의 ObjectId를 사용하지 않고 UUID 문자열 사용

    @Field("region_id")
    @Indexed
    private Long regionId;

    @Field("member_id")
    @Indexed
    private String memberId; // UUID를 문자열로 저장

    @Field("member_name")
    private String memberName;

    @Field("content")
    private String content;

    @Field("message_type")
    private String messageType; // CHAT, ENTER, LEAVE, SYSTEM, WELCOME

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("images")
    private List<String> images; // Base64 이미지 또는 이미지 URL

    @Field("image_count")
    private Integer imageCount;

    @Field("portfolio_stocks")
    private List<Map<String, Object>> portfolioStocks; // 보유종목 정보
}
