package com.hanazoom.service;

import com.hanazoom.dto.member.SignupRequest;

public interface MemberService {
    void signup(SignupRequest request);
}