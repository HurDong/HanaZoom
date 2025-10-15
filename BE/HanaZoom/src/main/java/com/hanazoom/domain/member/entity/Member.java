package com.hanazoom.domain.member.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "members", indexes = {
    @Index(name = "idx_members_email", columnList = "email", unique = true),
    @Index(name = "idx_members_region_id", columnList = "region_id"),
    @Index(name = "idx_members_email_region", columnList = "email, region_id"),
    @Index(name = "idx_members_pb_status", columnList = "pb_status"),
    @Index(name = "idx_members_created_at", columnList = "created_at"),
    @Index(name = "idx_members_last_login", columnList = "last_login_at")
})
@Getter
@Setter
@NoArgsConstructor
public class Member implements UserDetails {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 60) 
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

    @Column(name = "login_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private LoginType loginType = LoginType.EMAIL;

    @Column(name = "terms_agreed", nullable = false)
    private boolean termsAgreed;

    @Column(name = "privacy_agreed", nullable = false)
    private boolean privacyAgreed;

    @Column(name = "marketing_agreed", nullable = false)
    private boolean marketingAgreed;


    @Column(name = "is_pb", nullable = false)
    private boolean isPb = false;

    @Column(name = "pb_license_number")
    private String pbLicenseNumber;

    @Column(name = "pb_experience_years")
    private Integer pbExperienceYears;

    @Column(name = "pb_specialties")
    private String pbSpecialties; 

    @Column(name = "pb_region")
    private String pbRegion;

    @Column(name = "pb_rating")
    private Double pbRating = 5.0;

    @Column(name = "pb_total_consultations")
    private Integer pbTotalConsultations = 0;

    @Column(name = "pb_status")
    @Enumerated(EnumType.STRING)
    private PbStatus pbStatus = PbStatus.INACTIVE;

    @Column(name = "pb_approved_at")
    private LocalDateTime pbApprovedAt;

    @Column(name = "pb_approved_by")
    private String pbApprovedBy; 

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SocialAccount> socialAccounts = new ArrayList<>();


    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<com.hanazoom.domain.portfolio.entity.Account> accounts = new ArrayList<>();


    @OneToOne(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserSettings userSettings;

    @Builder
    public Member(String email, String password, String name, String phone,
            String address, String detailAddress, String zonecode,
            Double latitude, Double longitude, Long regionId,
            boolean termsAgreed, boolean privacyAgreed, boolean marketingAgreed,
            LoginType loginType, boolean isPb, String pbLicenseNumber,
            Integer pbExperienceYears, String pbSpecialties, String pbRegion,
            Double pbRating, Integer pbTotalConsultations, PbStatus pbStatus,
            LocalDateTime pbApprovedAt, String pbApprovedBy) {
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
        this.loginType = loginType != null ? loginType : LoginType.EMAIL;
        this.isPb = isPb;
        this.pbLicenseNumber = pbLicenseNumber;
        this.pbExperienceYears = pbExperienceYears;
        this.pbSpecialties = pbSpecialties;
        this.pbRegion = pbRegion;
        this.pbRating = pbRating != null ? pbRating : 0.0;
        this.pbTotalConsultations = pbTotalConsultations != null ? pbTotalConsultations : 0;
        this.pbStatus = pbStatus != null ? pbStatus : PbStatus.INACTIVE;
        this.pbApprovedAt = pbApprovedAt;
        this.pbApprovedBy = pbApprovedBy;
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

    public void addSocialAccount(SocialAccount socialAccount) {
        this.socialAccounts.add(socialAccount);
        socialAccount.updateLastLogin();
    }

    public void removeSocialAccount(SocialAccount socialAccount) {
        this.socialAccounts.remove(socialAccount);
    }

    public boolean hasSocialAccount(SocialProvider provider) {
        return this.socialAccounts.stream()
                .anyMatch(account -> account.getProvider() == provider);
    }

    public SocialAccount getSocialAccount(SocialProvider provider) {
        return this.socialAccounts.stream()
                .filter(account -> account.getProvider() == provider)
                .findFirst()
                .orElse(null);
    }


    public void addAccount(com.hanazoom.domain.portfolio.entity.Account account) {
        this.accounts.add(account);
    }

    public void removeAccount(com.hanazoom.domain.portfolio.entity.Account account) {
        this.accounts.remove(account);
    }

    public com.hanazoom.domain.portfolio.entity.Account getMainAccount() {
        return this.accounts.stream()
                .filter(com.hanazoom.domain.portfolio.entity.Account::isMainAccount)
                .findFirst()
                .orElse(null);
    }

    public List<com.hanazoom.domain.portfolio.entity.Account> getActiveAccounts() {
        return this.accounts.stream()
                .filter(com.hanazoom.domain.portfolio.entity.Account::isActive)
                .toList();
    }

    public boolean hasActiveAccounts() {
        return this.accounts.stream().anyMatch(com.hanazoom.domain.portfolio.entity.Account::isActive);
    }


    public void promoteToPb(String pbLicenseNumber, Integer pbExperienceYears,
            String pbSpecialties, String pbRegion, String approvedBy) {
        this.isPb = true;
        this.pbLicenseNumber = pbLicenseNumber;
        this.pbExperienceYears = pbExperienceYears;
        this.pbSpecialties = pbSpecialties;
        this.pbRegion = pbRegion;
        this.pbStatus = PbStatus.ACTIVE;
        this.pbApprovedAt = LocalDateTime.now();
        this.pbApprovedBy = approvedBy;
    }

    public void demoteFromPb() {
        this.isPb = false;
        this.pbLicenseNumber = null;
        this.pbExperienceYears = null;
        this.pbSpecialties = null;
        this.pbRegion = null;
        this.pbRating = 0.0;
        this.pbTotalConsultations = 0;
        this.pbStatus = PbStatus.INACTIVE;
        this.pbApprovedAt = null;
        this.pbApprovedBy = null;
    }

    public void updatePbInfo(String pbSpecialties, String pbRegion) {
        this.pbSpecialties = pbSpecialties;
        this.pbRegion = pbRegion;
    }

    public void updatePbRating(Double newRating) {
        this.pbRating = newRating;
    }

    public void incrementConsultationCount() {
        this.pbTotalConsultations++;
    }

    public void suspendPb() {
        this.pbStatus = PbStatus.SUSPENDED;
    }

    public void activatePb() {
        this.pbStatus = PbStatus.ACTIVE;
    }

    public boolean isActivePb() {
        return this.isPb && this.pbStatus == PbStatus.ACTIVE;
    }

    public boolean isPendingPb() {
        return this.pbStatus == PbStatus.PENDING;
    }

    public boolean isSuspendedPb() {
        return this.pbStatus == PbStatus.SUSPENDED;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (isActivePb()) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_USER"),
                    new SimpleGrantedAuthority("ROLE_PB"));
        }
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