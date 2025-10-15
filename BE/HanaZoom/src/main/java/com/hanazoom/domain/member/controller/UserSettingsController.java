package com.hanazoom.domain.member.controller;

import com.hanazoom.domain.member.dto.UpdateUserSettingsRequest;
import com.hanazoom.domain.member.dto.UserSettingsDto;
import com.hanazoom.domain.member.entity.Member;
import com.hanazoom.domain.member.entity.UserSettings;
import com.hanazoom.domain.member.repository.MemberRepository;
import com.hanazoom.domain.member.service.UserSettingsService;
import com.hanazoom.global.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user-settings")
@RequiredArgsConstructor
@Slf4j
public class UserSettingsController {

    private final UserSettingsService userSettingsService;
    private final MemberRepository memberRepository;

    private UUID getMemberIdFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        log.info("🔍 Authentication에서 이메일 추출: {}", email);
        
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
        
        log.info("✅ 사용자 ID 추출 완료: {}", member.getId());
        return member.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserSettingsDto>> getUserSettings(Authentication authentication) {
        try {
            log.info("🔍 사용자 설정 조회 요청");
            
            UUID memberId = getMemberIdFromAuthentication(authentication);
            UserSettingsDto settings = userSettingsService.getUserSettings(memberId);
            
            log.info("✅ 사용자 설정 조회 성공 - memberId: {}", memberId);
            return ResponseEntity.ok(ApiResponse.success(settings, "사용자 설정을 조회했습니다."));
            
        } catch (Exception e) {
            log.error("❌ 사용자 설정 조회 실패", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("사용자 설정 조회에 실패했습니다: " + e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserSettingsDto>> updateUserSettings(
            @Valid @RequestBody UpdateUserSettingsRequest request,
            Authentication authentication) {
        try {
            log.info("🔄 사용자 설정 업데이트 요청");
            
            UUID memberId = getMemberIdFromAuthentication(authentication);
            UserSettingsDto updatedSettings = userSettingsService.updateUserSettings(memberId, request);
            
            log.info("✅ 사용자 설정 업데이트 성공 - memberId: {}", memberId);
            return ResponseEntity.ok(ApiResponse.success(updatedSettings, "사용자 설정이 업데이트되었습니다."));
            
        } catch (IllegalArgumentException e) {
            log.error("❌ 사용자 설정 업데이트 실패 - 잘못된 요청: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("잘못된 요청입니다: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 사용자 설정 업데이트 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("사용자 설정 업데이트에 실패했습니다: " + e.getMessage()));
        }
    }

    @PatchMapping("/theme")
    public ResponseEntity<ApiResponse<UserSettingsDto>> updateTheme(
            @RequestParam String theme,
            Authentication authentication) {
        try {
            log.info("🎨 테마 설정 업데이트 요청 - theme: {}", theme);
            
            UUID memberId = getMemberIdFromAuthentication(authentication);
            
            UpdateUserSettingsRequest request = UpdateUserSettingsRequest.builder()
                    .theme(UserSettings.ThemeType.valueOf(theme.toUpperCase()))
                    .build();
            
            UserSettingsDto updatedSettings = userSettingsService.updateUserSettings(memberId, request);
            
            log.info("✅ 테마 설정 업데이트 성공 - memberId: {}, theme: {}", memberId, theme);
            return ResponseEntity.ok(ApiResponse.success(updatedSettings, "테마가 변경되었습니다."));
            
        } catch (IllegalArgumentException e) {
            log.error("❌ 테마 설정 업데이트 실패 - 잘못된 테마: {}", theme);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("잘못된 테마입니다: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 테마 설정 업데이트 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("테마 설정 업데이트에 실패했습니다: " + e.getMessage()));
        }
    }

    @PatchMapping("/cursor")
    public ResponseEntity<ApiResponse<UserSettingsDto>> updateCustomCursor(
            @RequestParam boolean enabled,
            Authentication authentication) {
        try {
            log.info("🖱️ 커스텀 커서 설정 업데이트 요청 - enabled: {}", enabled);
            
            UUID memberId = getMemberIdFromAuthentication(authentication);
            
            UpdateUserSettingsRequest request = UpdateUserSettingsRequest.builder()
                    .customCursorEnabled(enabled)
                    .build();
            
            UserSettingsDto updatedSettings = userSettingsService.updateUserSettings(memberId, request);
            
            log.info("✅ 커스텀 커서 설정 업데이트 성공 - memberId: {}, enabled: {}", memberId, enabled);
            return ResponseEntity.ok(ApiResponse.success(updatedSettings, "마우스 커서 설정이 변경되었습니다."));
            
        } catch (Exception e) {
            log.error("❌ 커스텀 커서 설정 업데이트 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("마우스 커서 설정 업데이트에 실패했습니다: " + e.getMessage()));
        }
    }

    @PatchMapping("/emoji")
    public ResponseEntity<ApiResponse<UserSettingsDto>> updateEmojiAnimation(
            @RequestParam boolean enabled,
            Authentication authentication) {
        try {
            log.info("✨ 이모지 애니메이션 설정 업데이트 요청 - enabled: {}", enabled);
            
            UUID memberId = getMemberIdFromAuthentication(authentication);
            
            UpdateUserSettingsRequest request = UpdateUserSettingsRequest.builder()
                    .emojiAnimationEnabled(enabled)
                    .build();
            
            UserSettingsDto updatedSettings = userSettingsService.updateUserSettings(memberId, request);
            
            log.info("✅ 이모지 애니메이션 설정 업데이트 성공 - memberId: {}, enabled: {}", memberId, enabled);
            return ResponseEntity.ok(ApiResponse.success(updatedSettings, "이모지 애니메이션 설정이 변경되었습니다."));
            
        } catch (Exception e) {
            log.error("❌ 이모지 애니메이션 설정 업데이트 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("이모지 애니메이션 설정 업데이트에 실패했습니다: " + e.getMessage()));
        }
    }
}
