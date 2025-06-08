package com.hanazoom.service;

import com.hanazoom.dto.member.LoginRequest;
import com.hanazoom.dto.member.LoginResponse;
import com.hanazoom.dto.member.SignupRequest;

public interface MemberService {
    void signup(SignupRequest request);

    LoginResponse login(LoginRequest request);
}