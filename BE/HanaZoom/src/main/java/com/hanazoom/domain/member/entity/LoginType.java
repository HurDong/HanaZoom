package com.hanazoom.domain.member.entity;

public enum LoginType {
    EMAIL("email"),
    KAKAO("kakao"),
    GOOGLE("google"),
    NAVER("naver"),
    APPLE("apple"),
    FACEBOOK("facebook");

    private final String type;

    LoginType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public static LoginType fromString(String type) {
        for (LoginType loginType : LoginType.values()) {
            if (loginType.type.equalsIgnoreCase(type)) {
                return loginType;
            }
        }
        throw new IllegalArgumentException("Unknown login type: " + type);
    }
}
