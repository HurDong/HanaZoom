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
    

    private UserSettings.ThemeType theme;
    private Boolean customCursorEnabled;
    private Boolean emojiAnimationEnabled;
    

    private Boolean pushNotificationsEnabled;
    

    private Integer defaultMapZoom;
    private UserSettings.MapStyleType mapStyle;
    
    

    private UserSettings.UiDensityType uiDensity;
}
