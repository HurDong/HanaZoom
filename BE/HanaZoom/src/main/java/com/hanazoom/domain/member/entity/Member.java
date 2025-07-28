package com.hanazoom.domain.member.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor
public class Member implements UserDetails {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 60) // BCrypt 해시는 항상 60자
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "detail_address")
    private String detailAddress;

    @Column(name = "zonecode")
    private String zonecode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "region_id")
    private Long regionId;

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
            String address, String detailAddress, String zonecode,
            Double latitude, Double longitude, Long regionId,
            boolean termsAgreed, boolean privacyAgreed, boolean marketingAgreed) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.detailAddress = detailAddress;
        this.zonecode = zonecode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.regionId = regionId;
        this.termsAgreed = termsAgreed;
        this.privacyAgreed = privacyAgreed;
        this.marketingAgreed = marketingAgreed;
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updatePassword(String newPassword) {
        this.password = newPassword;
    }

    public void updateAddress(String address, String detailAddress, String zonecode) {
        this.address = address;
        this.detailAddress = detailAddress;
        this.zonecode = zonecode;
    }

    public void updateCoordinates(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void updateMarketingAgreement(boolean agreed) {
        this.marketingAgreed = agreed;
    }

    public void updateRegion(Long regionId) {
        this.regionId = regionId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}