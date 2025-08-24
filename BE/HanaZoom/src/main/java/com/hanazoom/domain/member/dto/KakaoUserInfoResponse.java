package com.hanazoom.domain.member.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class KakaoUserInfoResponse {
    private Long id;

    @JsonProperty("connected_at")
    private String connectedAt;

    private KakaoAccount account;

    private KakaoProperties properties;

    @Getter
    @NoArgsConstructor
    public static class KakaoAccount {
        @JsonProperty("profile_nickname_needs_agreement")
        private Boolean profileNicknameNeedsAgreement;

        @JsonProperty("profile_image_needs_agreement")
        private Boolean profileImageNeedsAgreement;

        private KakaoProfile profile;

        @JsonProperty("email_needs_agreement")
        private Boolean emailNeedsAgreement;

        @JsonProperty("is_email_valid")
        private Boolean isEmailValid;

        @JsonProperty("is_email_verified")
        private Boolean isEmailVerified;

        private String email;

        @JsonProperty("age_range_needs_agreement")
        private Boolean ageRangeNeedsAgreement;

        @JsonProperty("age_range")
        private String ageRange;

        @JsonProperty("birthday_needs_agreement")
        private Boolean birthdayNeedsAgreement;

        private String birthday;

        @JsonProperty("gender_needs_agreement")
        private Boolean genderNeedsAgreement;

        private String gender;

        @JsonProperty("phone_number_needs_agreement")
        private Boolean phoneNumberNeedsAgreement;

        @JsonProperty("phone_number")
        private String phoneNumber;

        @JsonProperty("ci_needs_agreement")
        private Boolean ciNeedsAgreement;

        private String ci;

        @JsonProperty("ci_authenticated_at")
        private String ciAuthenticatedAt;
    }

    @Getter
    @NoArgsConstructor
    public static class KakaoProfile {
        private String nickname;

        @JsonProperty("thumbnail_image_url")
        private String thumbnailImageUrl;

        @JsonProperty("profile_image_url")
        private String profileImageUrl;

        @JsonProperty("is_default_image")
        private Boolean isDefaultImage;
    }

    @Getter
    @NoArgsConstructor
    public static class KakaoProperties {
        private String nickname;

        @JsonProperty("profile_image")
        private String profileImage;

        @JsonProperty("thumbnail_image")
        private String thumbnailImage;
    }
}
