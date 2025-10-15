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
@Table(name = "user_settings", indexes = {
    @Index(name = "idx_user_settings_member_id", columnList = "member_id", unique = true),
    @Index(name = "idx_user_settings_theme", columnList = "theme"),
    @Index(name = "idx_user_settings_created_at", columnList = "created_at")
})
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


    @Column(name = "theme", nullable = false)
    @Enumerated(EnumType.STRING)
    private ThemeType theme = ThemeType.SYSTEM;


    @Column(name = "custom_cursor_enabled", nullable = false)
    private boolean customCursorEnabled = true;


    @Column(name = "emoji_animation_enabled", nullable = false)
    private boolean emojiAnimationEnabled = true;


    @Column(name = "push_notifications_enabled", nullable = false)
    private boolean pushNotificationsEnabled = true;


    @Column(name = "default_map_zoom", nullable = false)
    private Integer defaultMapZoom = 8;

    @Column(name = "map_style", nullable = false)
    @Enumerated(EnumType.STRING)
    private MapStyleType mapStyle = MapStyleType.STANDARD;



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
                       Integer defaultMapZoom, MapStyleType mapStyle, UiDensityType uiDensity) {
        this.member = member;
        this.theme = theme != null ? theme : ThemeType.SYSTEM;
        this.customCursorEnabled = customCursorEnabled;
        this.emojiAnimationEnabled = emojiAnimationEnabled;
        this.pushNotificationsEnabled = pushNotificationsEnabled;
        this.defaultMapZoom = defaultMapZoom != null ? defaultMapZoom : 8;
        this.mapStyle = mapStyle != null ? mapStyle : MapStyleType.STANDARD;
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


    public void updateUiDensity(UiDensityType density) {
        this.uiDensity = density;
    }


    public enum ThemeType {
        LIGHT, DARK, SYSTEM
    }

    public enum MapStyleType {
        STANDARD, SATELLITE, HYBRID
    }


    public enum UiDensityType {
        COMPACT, NORMAL, COMFORTABLE
    }
}
