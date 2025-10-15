package com.hanazoom.domain.member.service;

import com.hanazoom.domain.member.dto.UpdateUserSettingsRequest;
import com.hanazoom.domain.member.dto.UserSettingsDto;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.entity.UserSettings;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.member.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final MemberRepository memberRepository;

    public UserSettingsDto getUserSettings(UUID memberId) {
        log.info("🔍 사용자 설정 조회 시작 - memberId: {}", memberId);
        
        UserSettings settings = userSettingsRepository.findByMemberId(memberId)
                .orElseGet(() -> {
                    log.info("📝 사용자 설정이 없어서 기본 설정으로 생성 - memberId: {}", memberId);
                    return createDefaultSettings(memberId);
                });
        
        UserSettingsDto dto = UserSettingsDto.fromEntity(settings);
        log.info("✅ 사용자 설정 조회 완료 - memberId: {}", memberId);
        return dto;
    }

    @Transactional
    public UserSettingsDto updateUserSettings(UUID memberId, UpdateUserSettingsRequest request) {
        log.info("🔄 사용자 설정 업데이트 시작 - memberId: {}", memberId);
        
        UserSettings settings = userSettingsRepository.findByMemberId(memberId)
                .orElseGet(() -> {
                    log.info("📝 사용자 설정이 없어서 기본 설정으로 생성 후 업데이트 - memberId: {}", memberId);
                    return createDefaultSettings(memberId);
                });


        if (request.getTheme() != null) {
            settings.updateTheme(request.getTheme());
            log.info("🎨 테마 설정 업데이트: {}", request.getTheme());
        }
        
        if (request.getCustomCursorEnabled() != null) {
            settings.updateCustomCursor(request.getCustomCursorEnabled());
            log.info("🖱️ 커스텀 커서 설정 업데이트: {}", request.getCustomCursorEnabled());
        }
        
        if (request.getEmojiAnimationEnabled() != null) {
            settings.updateEmojiAnimation(request.getEmojiAnimationEnabled());
            log.info("✨ 이모지 애니메이션 설정 업데이트: {}", request.getEmojiAnimationEnabled());
        }
        
        if (request.getPushNotificationsEnabled() != null) {
            settings.updatePushNotifications(request.getPushNotificationsEnabled());
            log.info("🔔 푸시 알림 설정 업데이트: {}", request.getPushNotificationsEnabled());
        }
        
        if (request.getDefaultMapZoom() != null || request.getMapStyle() != null) {
            settings.updateMapSettings(request.getDefaultMapZoom(), request.getMapStyle());
            log.info("🗺️ 지도 설정 업데이트 - zoom: {}, style: {}", 
                    request.getDefaultMapZoom(), request.getMapStyle());
        }
        
        
        if (request.getUiDensity() != null) {
            settings.updateUiDensity(request.getUiDensity());
            log.info("📱 UI 밀도 설정 업데이트: {}", request.getUiDensity());
        }

        UserSettings savedSettings = userSettingsRepository.save(settings);
        UserSettingsDto dto = UserSettingsDto.fromEntity(savedSettings);
        
        log.info("✅ 사용자 설정 업데이트 완료 - memberId: {}", memberId);
        return dto;
    }

    @Transactional
    public UserSettings createDefaultSettings(UUID memberId) {
        log.info("📝 기본 사용자 설정 생성 시작 - memberId: {}", memberId);
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + memberId));

        UserSettings defaultSettings = UserSettings.builder()
                .member(member)
                .build();

        UserSettings savedSettings = userSettingsRepository.save(defaultSettings);
        log.info("✅ 기본 사용자 설정 생성 완료 - memberId: {}, settingsId: {}", 
                memberId, savedSettings.getId());
        
        return savedSettings;
    }

    @Transactional
    public void deleteUserSettings(UUID memberId) {
        log.info("🗑️ 사용자 설정 삭제 시작 - memberId: {}", memberId);
        
        if (userSettingsRepository.existsByMemberId(memberId)) {
            userSettingsRepository.deleteByMemberId(memberId);
            log.info("✅ 사용자 설정 삭제 완료 - memberId: {}", memberId);
        } else {
            log.info("ℹ️ 삭제할 사용자 설정이 없음 - memberId: {}", memberId);
        }
    }
}
