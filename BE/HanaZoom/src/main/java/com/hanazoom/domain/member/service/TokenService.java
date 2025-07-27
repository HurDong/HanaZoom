package com.hanazoom.domain.member.service;

import java.util.UUID;

public interface TokenService {
    void saveRefreshToken(UUID memberId, String refreshToken);

    boolean validateRefreshToken(UUID memberId, String refreshToken);

    void removeAllTokens(UUID memberId);
}