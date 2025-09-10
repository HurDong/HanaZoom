package com.hanazoom.domain.member.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
public class UserSettings {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;

    // 테마 설정
    @Column(name = "theme", nullable = false)
    @Enumerated(EnumType.STRING)
    private ThemeType theme = ThemeType.SYSTEM;

    // 마우스 커서 설정
    @Column(name = "custom_cursor_enabled", nullable = false)
    private boolean customCursorEnabled = true;

    // 이모지 애니메이션 설정
    @Column(name = "emoji_animation_enabled", nullable = false)
    private boolean emojiAnimationEnabled = true;

    // 알림 설정
    @Column(name = "push_notifications_enabled", nullable = false)
    private boolean pushNotificationsEnabled = true;

    // 지도 설정
    @Column(name = "default_map_zoom", nullable = false)
    private Integer defaultMapZoom = 8;

    @Column(name = "map_style", nullable = false)
    @Enumerated(EnumType.STRING)
    private MapStyleType mapStyle = MapStyleType.STANDARD;

    // 차트 설정
    @Column(name = "chart_theme", nullable = false)
    @Enumerated(EnumType.STRING)
    private ChartThemeType chartTheme = ChartThemeType.GREEN;

    @Column(name = "chart_animation_speed", nullable = false)
    private Integer chartAnimationSpeed = 300; // milliseconds

    // 실시간 업데이트 설정
    @Column(name = "auto_refresh_interval", nullable = false)
    private Integer autoRefreshInterval = 300; // seconds (5분)

    // UI 밀도 설정
    @Column(name = "ui_density", nullable = false)
    @Enumerated(EnumType.STRING)
    private UiDensityType uiDensity = UiDensityType.NORMAL;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public UserSettings(Member member, ThemeType theme, boolean customCursorEnabled,
                       boolean emojiAnimationEnabled, boolean pushNotificationsEnabled,
                       Integer defaultMapZoom, MapStyleType mapStyle, ChartThemeType chartTheme,
                       Integer chartAnimationSpeed, Integer autoRefreshInterval, UiDensityType uiDensity) {
        this.member = member;
        this.theme = theme != null ? theme : ThemeType.SYSTEM;
        this.customCursorEnabled = customCursorEnabled;
        this.emojiAnimationEnabled = emojiAnimationEnabled;
        this.pushNotificationsEnabled = pushNotificationsEnabled;
        this.defaultMapZoom = defaultMapZoom != null ? defaultMapZoom : 8;
        this.mapStyle = mapStyle != null ? mapStyle : MapStyleType.STANDARD;
        this.chartTheme = chartTheme != null ? chartTheme : ChartThemeType.GREEN;
        this.chartAnimationSpeed = chartAnimationSpeed != null ? chartAnimationSpeed : 300;
        this.autoRefreshInterval = autoRefreshInterval != null ? autoRefreshInterval : 300;
        this.uiDensity = uiDensity != null ? uiDensity : UiDensityType.NORMAL;
    }

    public void updateTheme(ThemeType theme) {
        this.theme = theme;
    }

    public void updateCustomCursor(boolean enabled) {
        this.customCursorEnabled = enabled;
    }

    public void updateEmojiAnimation(boolean enabled) {
        this.emojiAnimationEnabled = enabled;
    }

    public void updatePushNotifications(boolean enabled) {
        this.pushNotificationsEnabled = enabled;
    }

    public void updateMapSettings(Integer zoom, MapStyleType style) {
        if (zoom != null) this.defaultMapZoom = zoom;
        if (style != null) this.mapStyle = style;
    }

    public void updateChartSettings(ChartThemeType theme, Integer animationSpeed) {
        if (theme != null) this.chartTheme = theme;
        if (animationSpeed != null) this.chartAnimationSpeed = animationSpeed;
    }

    public void updateAutoRefresh(Integer interval) {
        if (interval != null) this.autoRefreshInterval = interval;
    }

    public void updateUiDensity(UiDensityType density) {
        this.uiDensity = density;
    }

    // 열거형 정의
    public enum ThemeType {
        LIGHT, DARK, SYSTEM
    }

    public enum MapStyleType {
        STANDARD, SATELLITE, HYBRID
    }

    public enum ChartThemeType {
        GREEN, BLUE, PURPLE, ORANGE
    }

    public enum UiDensityType {
        COMPACT, NORMAL, COMFORTABLE
    }
}
