package com.hanazoom.domain.portfolio.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "account_number", nullable = false, length = 20)
    private String accountNumber;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType = AccountType.STOCK;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "is_main_account", nullable = false)
    private boolean isMainAccount = false;

    @Column(name = "broker", length = 50)
    private String broker;

    @Column(name = "created_date")
    private LocalDate createdDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 연관관계 매핑
    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PortfolioStock> portfolioStocks = new ArrayList<>();

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AccountBalance> accountBalances = new ArrayList<>();

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TradeHistory> tradeHistories = new ArrayList<>();

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PortfolioPerformance> portfolioPerformances = new ArrayList<>();

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PortfolioAlert> portfolioAlerts = new ArrayList<>();

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RebalancingHistory> rebalancingHistories = new ArrayList<>();

    @Builder
    public Account(Member member, String accountNumber, String accountName,
            AccountType accountType, String broker, LocalDate createdDate,
            boolean isMainAccount) {
        this.member = member;
        this.accountNumber = accountNumber;
        this.accountName = accountName;
        this.accountType = accountType;
        this.broker = broker;
        this.createdDate = createdDate;
        this.isMainAccount = isMainAccount;
    }

    // 계좌 활성화/비활성화
    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    // 주계좌 설정
    public void setAsMainAccount() {
        this.isMainAccount = true;
    }

    public void unsetAsMainAccount() {
        this.isMainAccount = false;
    }

    // 계좌 정보 업데이트
    public void updateAccountInfo(String accountName, String broker) {
        this.accountName = accountName;
        this.broker = broker;
    }
}
