package com.hanazoom.domain.consultation.entity;

public enum ConsultationType {
    SLOT("PB 슬롯", 0, 30),
    PORTFOLIO_ANALYSIS("포트폴리오 분석", 49000, 60), // 100,000 → 49,000원 (합리적 가격)
    STOCK_CONSULTATION("종목 상담", 19900, 30), // 30,000 → 19,900원 (부담없는 가격)
    PRODUCT_CONSULTATION("상품 상담", 29900, 45), // 50,000 → 29,900원
    GENERAL_CONSULTATION("일반 상담", 29900, 60), // 50,000 → 29,900원
    INSURANCE_CONSULTATION("보험 상담", 29900, 45), // 50,000 → 29,900원
    TAX_CONSULTATION("세금 상담", 34900, 30); // 50,000 → 34,900원 (전문 분야)

    private final String displayName;
    private final int defaultFee;
    private final int defaultDurationMinutes;

    ConsultationType(String displayName, int defaultFee, int defaultDurationMinutes) {
        this.displayName = displayName;
        this.defaultFee = defaultFee;
        this.defaultDurationMinutes = defaultDurationMinutes;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getDefaultFee() {
        return defaultFee;
    }

    public int getDefaultDurationMinutes() {
        return defaultDurationMinutes;
    }
}
