package com.hanazoom.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "kis")
public class KisConfig {
    private String appKey;
    private String appSecret;
    private String accountCode;
    private String productCode;
    private String accessToken;
    private String approvalKey;

    // 모의투자 환경 URL
    private final String tokenUrl = "https://openapivts.koreainvestment.com:29443/oauth2/tokenP";
    private final String approvalUrl = "https://openapivts.koreainvestment.com:29443/oauth2/Approval";
    private final String realtimeUrl = "ws://ops.koreainvestment.com:21000";
}