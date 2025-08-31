package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.portfolio.entity.Account;
import com.hanazoom.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    // 회원의 모든 계좌 조회
    List<Account> findByMember(Member member);

    // 회원의 활성화된 계좌 조회
    List<Account> findByMemberAndIsActiveTrue(Member member);

    // 회원의 주계좌 조회
    Optional<Account> findByMemberAndIsMainAccountTrue(Member member);

    // 계좌번호로 계좌 조회
    Optional<Account> findByAccountNumber(String accountNumber);

    // 회원과 계좌번호로 계좌 조회
    Optional<Account> findByMemberAndAccountNumber(Member member, String accountNumber);

    // 회원의 계좌 수 조회
    @Query("SELECT COUNT(a) FROM Account a WHERE a.member = :member AND a.isActive = true")
    long countActiveAccountsByMember(@Param("member") Member member);

    // 특정 증권사의 계좌 조회
    List<Account> findByMemberAndBroker(Member member, String broker);

    // 회원 ID로 계좌 조회
    Optional<Account> findByMemberId(java.util.UUID memberId);
}
