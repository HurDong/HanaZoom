package com.hanazoom.domain.member.entity;

public enum SocialProvider {
    KAKAO("kakao"),
    GOOGLE("google"),
    NAVER("naver"),
    APPLE("apple"),
    FACEBOOK("facebook");

    private final String provider;

    SocialProvider(String provider) {
        this.provider = provider;
    }

    public String getProvider() {
        return provider;
    }

    public static SocialProvider fromString(String provider) {
        for (SocialProvider socialProvider : SocialProvider.values()) {
            if (socialProvider.provider.equalsIgnoreCase(provider)) {
                return socialProvider;
            }
        }
        throw new IllegalArgumentException("Unknown social provider: " + provider);
    }
}
