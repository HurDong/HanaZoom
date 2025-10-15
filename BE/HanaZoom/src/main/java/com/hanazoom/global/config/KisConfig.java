package com.hanazoom.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "kis")
public class KisConfig implements InitializingBean {
    private String appKey;
    private String appSecret;
    private String accountCode;
    private String productCode;
    private String accessToken;
    private String approvalKey;

    public KisConfig() {
        System.out.println("🏗️ KisConfig 생성자 호출");
    }

    @PostConstruct
    public void init() {
        System.out.println("🎯 KisConfig 초기화 - appKey: " + (appKey != null ? "설정됨" : "NULL"));
        System.out.println("📝 KIS 설정 로드 완료");
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("🚀 KisConfig InitializingBean.afterPropertiesSet() 호출");
        System.out.println("🔑 KIS API 키 상태:");
        System.out.println("  - appKey: " + (appKey != null ? "설정됨" : "NULL"));
        System.out.println("  - appSecret: " + (appSecret != null ? "설정됨" : "NULL"));
        System.out.println("  - accountCode: " + (accountCode != null ? "설정됨" : "NULL"));
        System.out.println("  - productCode: " + productCode);
    }


    private final String tokenUrl = "https://openapivts.koreainvestment.com:29443/oauth2/tokenP";
    private final String approvalUrl = "https://openapivts.koreainvestment.com:29443/oauth2/Approval";
    private final String realtimeUrl = "ws://ops.koreainvestment.com:21000";
}