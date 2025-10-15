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
    private String id; 

    @Field("region_id")
    @Indexed
    private Long regionId;

    @Field("member_id")
    @Indexed
    private String memberId; 

    @Field("member_name")
    private String memberName;

    @Field("content")
    private String content;

    @Field("message_type")
    private String messageType; 

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("images")
    private List<String> images; 

    @Field("image_count")
    private Integer imageCount;

    @Field("portfolio_stocks")
    private List<Map<String, Object>> portfolioStocks; 
}
