package com.hanazoom.domain.portfolio.dto;

import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.portfolio.entity.AccountType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class AccountResponse {

    private Long id;
    private String accountNumber;
    private String accountName;
    private AccountType accountType;
    private boolean isActive;
    private boolean isMainAccount;
    private String broker;
    private LocalDate createdDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AccountResponse from(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .accountName(account.getAccountName())
                .accountType(account.getAccountType())
                .isActive(account.isActive())
                .isMainAccount(account.isMainAccount())
                .broker(account.getBroker())
                .createdDate(account.getCreatedDate())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
