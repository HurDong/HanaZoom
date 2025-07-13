package com.hanazoom.domain.member.entity;

import com.hanazoom.domain.region.Region;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "members")
public class Member {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Column(name = "region_id")
    private Long regionId;

    @Column(nullable = false)
    private boolean termsAgreed;

    @Column(nullable = false)
    private boolean privacyAgreed;

    @Column(nullable = false)
    private boolean marketingAgreed;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // 생성자
    public Member(String email, String password, String name, String phone,
            boolean termsAgreed, boolean privacyAgreed, boolean marketingAgreed, Long regionId) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.termsAgreed = termsAgreed;
        this.privacyAgreed = privacyAgreed;
        this.marketingAgreed = marketingAgreed;
        this.regionId = regionId;
    }

    // 업데이트 메서드
    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateRegion(Long regionId) {
        this.regionId = regionId;
    }

    public void updateMarketingAgreement(boolean agreed) {
        this.marketingAgreed = agreed;
    }
}