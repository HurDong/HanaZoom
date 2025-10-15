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


    List<Account> findByMember(Member member);


    List<Account> findByMemberAndIsActiveTrue(Member member);


    Optional<Account> findByMemberAndIsMainAccountTrue(Member member);


    Optional<Account> findByAccountNumber(String accountNumber);


    Optional<Account> findByMemberAndAccountNumber(Member member, String accountNumber);


    @Query("SELECT COUNT(a) FROM Account a WHERE a.member = :member AND a.isActive = true")
    long countActiveAccountsByMember(@Param("member") Member member);


    List<Account> findByMemberAndBroker(Member member, String broker);


    Optional<Account> findByMemberId(java.util.UUID memberId);
}
