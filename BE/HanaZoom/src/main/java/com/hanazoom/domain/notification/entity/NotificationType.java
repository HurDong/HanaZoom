package com.hanazoom.domain.notification.entity;

public enum NotificationType {

    STOCK_PRICE_UP_5("주식 상승 5%", "📈"),
    STOCK_PRICE_UP_10("주식 상승 10%", "🚀"),
    STOCK_PRICE_DOWN_5("주식 하락 5%", "📉"),
    STOCK_PRICE_DOWN_10("주식 하락 10%", "💥"),
    TARGET_PRICE_REACHED("목표가 도달", "🎯"),


    NEW_COMMENT("새 댓글", "💬"),
    NEW_LIKE("새 좋아요", "❤️"),
    MENTION("멘션", "👤"),
    POST_REPLY("게시글 답글", "↩️");

    private final String description;
    private final String emoji;

    NotificationType(String description, String emoji) {
        this.description = description;
        this.emoji = emoji;
    }

    public String getDescription() {
        return description;
    }

    public String getEmoji() {
        return emoji;
    }
}
