package com.hanazoom.domain.portfolio.repository;

import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.portfolio.entity.Portfolio;
import com.hanazoom.domain.stock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    
    Optional<Portfolio> findByMemberAndStock(Member member, Stock stock);
    
    List<Portfolio> findByMember(Member member);
    
    List<Portfolio> findByStock(Stock stock);
    
    boolean existsByMemberAndStock(Member member, Stock stock);
}

