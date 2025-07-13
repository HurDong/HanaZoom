package com.hanazoom.service.impl;

import com.hanazoom.config.JwtConfig;
import com.hanazoom.service.TokenService;
import com.hanazoom.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;

    // 임시 메모리 저장소 (개발용)
    private final ConcurrentHashMap<String, String> accessTokenStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> refreshTokenStore = new ConcurrentHashMap<>();

    private static final String ACCESS_TOKEN_PREFIX = "access_token:";
    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";

    @Override
    public void saveAccessToken(UUID memberId, String accessToken) {
        String key = ACCESS_TOKEN_PREFIX + memberId;
        accessTokenStore.put(key, accessToken);
        log.debug("Access Token 저장 완료: memberId={}", memberId);
    }

    @Override
    public void saveRefreshToken(UUID memberId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + memberId;
        refreshTokenStore.put(key, refreshToken);
        log.debug("Refresh Token 저장 완료: memberId={}", memberId);
    }

    @Override
    public boolean isValidAccessToken(UUID memberId, String accessToken) {
        String key = ACCESS_TOKEN_PREFIX + memberId;
        String storedToken = accessTokenStore.get(key);

        if (storedToken == null) {
            log.debug("저장된 Access Token이 없음: memberId={}", memberId);
            return false;
        }

        boolean isValid = storedToken.equals(accessToken) && jwtUtil.validateToken(accessToken);
        log.debug("Access Token 검증 결과: memberId={}, isValid={}", memberId, isValid);
        return isValid;
    }

    @Override
    public boolean isValidRefreshToken(UUID memberId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + memberId;
        String storedToken = refreshTokenStore.get(key);

        if (storedToken == null) {
            log.debug("저장된 Refresh Token이 없음: memberId={}", memberId);
            return false;
        }

        boolean isValid = storedToken.equals(refreshToken) && jwtUtil.validateToken(refreshToken);
        log.debug("Refresh Token 검증 결과: memberId={}, isValid={}", memberId, isValid);
        return isValid;
    }

    @Override
    public void removeAllTokens(UUID memberId) {
        String accessKey = ACCESS_TOKEN_PREFIX + memberId;
        String refreshKey = REFRESH_TOKEN_PREFIX + memberId;

        accessTokenStore.remove(accessKey);
        refreshTokenStore.remove(refreshKey);
        log.debug("모든 토큰 삭제 완료: memberId={}", memberId);
    }

    @Override
    public void removeAccessToken(UUID memberId, String accessToken) {
        String key = ACCESS_TOKEN_PREFIX + memberId;
        String storedToken = accessTokenStore.get(key);

        if (storedToken != null && storedToken.equals(accessToken)) {
            accessTokenStore.remove(key);
            log.debug("Access Token 삭제 완료: memberId={}", memberId);
        }
    }

    @Override
    public String refreshAccessToken(UUID memberId, String refreshToken) {
        // Refresh Token 검증
        if (!isValidRefreshToken(memberId, refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다.");
        }

        // 사용자 정보 추출
        String email = jwtUtil.getEmailFromToken(refreshToken);

        // 새로운 Access Token 생성
        String newAccessToken = jwtUtil.generateAccessToken(memberId, email);

        // 새로운 Access Token 저장
        saveAccessToken(memberId, newAccessToken);

        log.debug("Access Token 갱신 완료: memberId={}", memberId);
        return newAccessToken;
    }
}