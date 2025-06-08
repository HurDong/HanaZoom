package com.hanazoom.service.impl;

import com.hanazoom.domain.member.Member;
import com.hanazoom.dto.member.LoginRequest;
import com.hanazoom.dto.member.LoginResponse;
import com.hanazoom.dto.member.SignupRequest;
import com.hanazoom.repository.MemberRepository;
import com.hanazoom.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public void signup(SignupRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        Member member = new Member(
                request.getEmail(),
                request.getPassword(),
                request.getName(),
                request.getPhone(),
                request.isTermsAgreed(),
                request.isPrivacyAgreed(),
                request.isMarketingAgreed());

        memberRepository.save(member);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

        if (!member.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        member.updateLastLogin();
        // TODO: JWT 토큰 생성 로직 추가
        String token = "dummy-token";

        return new LoginResponse(member.getId(), member.getEmail(), member.getName(), token);
    }
}