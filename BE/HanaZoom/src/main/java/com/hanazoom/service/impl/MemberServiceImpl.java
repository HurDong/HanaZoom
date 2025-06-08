package com.hanazoom.service.impl;

import com.hanazoom.domain.member.Member;
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
}