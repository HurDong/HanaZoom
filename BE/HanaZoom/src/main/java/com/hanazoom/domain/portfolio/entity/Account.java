package com.hanazoom.domain.portfolio.entity;

import com.hanazoom.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Builder.Default
    private AccountType accountType = AccountType.STOCK;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "is_main_account", nullable = false)
    @Builder.Default
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




    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }


    public void setAsMainAccount() {
        this.isMainAccount = true;
    }

    public void unsetAsMainAccount() {
        this.isMainAccount = false;
    }


    public void updateAccountInfo(String accountName, String broker) {
        this.accountName = accountName;
        this.broker = broker;
    }
}
