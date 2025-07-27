package com.hanazoom.domain.member.service;

import com.hanazoom.global.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final RedisTemplate<String, String> redisTemplate;
    private final JwtUtil jwtUtil;

    private static final String REFRESH_TOKEN_PREFIX = "refresh:";
    private static final long REFRESH_TOKEN_TTL = 7L;

    @Override
    public void saveRefreshToken(UUID memberId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + memberId;
        redisTemplate.opsForValue().set(key, refreshToken, REFRESH_TOKEN_TTL, TimeUnit.DAYS);
    }

    @Override
    public boolean validateRefreshToken(UUID memberId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + memberId;
        String storedToken = redisTemplate.opsForValue().get(key);
        return refreshToken.equals(storedToken);
    }

    @Override
    public void removeAllTokens(UUID memberId) {
        String refreshKey = REFRESH_TOKEN_PREFIX + memberId;
        redisTemplate.delete(refreshKey);
    }
}