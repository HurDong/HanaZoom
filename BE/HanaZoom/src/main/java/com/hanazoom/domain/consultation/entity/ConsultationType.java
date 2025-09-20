package com.hanazoom.domain.consultation.entity;

public enum ConsultationType {
    SLOT("PB 슬롯", 0, 30),
    PORTFOLIO_ANALYSIS("포트폴리오 분석", 100000, 60),
    STOCK_CONSULTATION("종목 상담", 30000, 30),
    PRODUCT_CONSULTATION("상품 상담", 50000, 45),
    GENERAL_CONSULTATION("일반 상담", 50000, 60),
    INSURANCE_CONSULTATION("보험 상담", 50000, 45),
    TAX_CONSULTATION("세금 상담", 50000, 30);

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
