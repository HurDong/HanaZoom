package com.hanazoom.domain.portfolio.controller;

import com.hanazoom.domain.portfolio.dto.RegionalPortfolioAnalysisDto;
import com.hanazoom.domain.portfolio.service.RegionalPortfolioAnalysisService;
import com.hanazoom.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/portfolio/regional")
@RequiredArgsConstructor
public class RegionalPortfolioController {

    private final RegionalPortfolioAnalysisService regionalPortfolioAnalysisService;
    private final MemberRepository memberRepository;

    @GetMapping("/analysis")
    public ResponseEntity<?> getRegionalPortfolioAnalysis(
            Authentication authentication) {
        
        try {

            String userEmail = authentication.getName();
            log.info("지역별 포트폴리오 분석 요청 - userEmail: {}", userEmail);
            

            UUID memberId = memberRepository.findByEmail(userEmail)
                    .orElseThrow(() -> {
                        log.error("❌ 사용자를 찾을 수 없습니다: {}", userEmail);
                        return new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userEmail);
                    })
                    .getId();
            
            log.info("사용자 조회 완료 - memberId: {}", memberId);
            

            RegionalPortfolioAnalysisDto analysis = regionalPortfolioAnalysisService
                    .analyzeRegionalPortfolio(memberId);
            
            log.info("지역별 포트폴리오 분석 완료 - memberId: {}, 적합도: {}점", 
                    memberId, analysis.getSuitabilityScore());
            
            return ResponseEntity.ok(analysis);
            
        } catch (IllegalArgumentException e) {
            log.warn("지역별 포트폴리오 분석 실패 - 잘못된 요청: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
            
        } catch (Exception e) {
            log.error("지역별 포트폴리오 분석 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "서버 내부 오류가 발생했습니다."));
        }
    }
}
