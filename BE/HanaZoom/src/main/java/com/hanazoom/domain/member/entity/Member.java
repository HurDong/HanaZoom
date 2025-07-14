package com.hanazoom.domain.member.entity;

import com.hanazoom.domain.region.entity.Region;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "members")
public class Member {

    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @Column(name = "terms_agreed", nullable = false)
    private boolean termsAgreed;

    @Column(name = "privacy_agreed", nullable = false)
    private boolean privacyAgreed;

    @Column(name = "marketing_agreed", nullable = false)
    private boolean marketingAgreed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Builder
    public Member(String email, String password, String name, String phone,
            boolean termsAgreed, boolean privacyAgreed, boolean marketingAgreed, Region region) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.termsAgreed = termsAgreed;
        this.privacyAgreed = privacyAgreed;
        this.marketingAgreed = marketingAgreed;
        this.region = region;
    }

    // 업데이트 메서드
    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateRegion(Region region) {
        this.region = region;
    }

    public void updateMarketingAgreement(boolean agreed) {
        this.marketingAgreed = agreed;
    }
}