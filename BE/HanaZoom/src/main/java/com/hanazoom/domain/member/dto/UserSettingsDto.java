package com.hanazoom.domain.member.dto;

import com.hanazoom.domain.member.entity.UserSettings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsDto {
    
    private UUID id;
    private UUID memberId;
    
    // 테마 설정
    private UserSettings.ThemeType theme;
    private boolean customCursorEnabled;
    private boolean emojiAnimationEnabled;
    
    // 알림 설정
    private boolean pushNotificationsEnabled;
    
    // 지도 설정
    private Integer defaultMapZoom;
    private UserSettings.MapStyleType mapStyle;
    
    
    // UI 밀도 설정
    private UserSettings.UiDensityType uiDensity;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static UserSettingsDto fromEntity(UserSettings settings) {
        if (settings == null) {
            return null;
        }
        
        return UserSettingsDto.builder()
                .id(settings.getId())
                .memberId(settings.getMember().getId())
                .theme(settings.getTheme())
                .customCursorEnabled(settings.isCustomCursorEnabled())
                .emojiAnimationEnabled(settings.isEmojiAnimationEnabled())
                .pushNotificationsEnabled(settings.isPushNotificationsEnabled())
                .defaultMapZoom(settings.getDefaultMapZoom())
                .mapStyle(settings.getMapStyle())
                .uiDensity(settings.getUiDensity())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}
