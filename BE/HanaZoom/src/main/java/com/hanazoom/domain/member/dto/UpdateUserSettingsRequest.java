package com.hanazoom.domain.member.dto;

import com.hanazoom.domain.member.entity.UserSettings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserSettingsRequest {
    
    // 테마 설정
    private UserSettings.ThemeType theme;
    private Boolean customCursorEnabled;
    private Boolean emojiAnimationEnabled;
    
    // 알림 설정
    private Boolean pushNotificationsEnabled;
    
    // 지도 설정
    private Integer defaultMapZoom;
    private UserSettings.MapStyleType mapStyle;
    
    
    // UI 밀도 설정
    private UserSettings.UiDensityType uiDensity;
}
