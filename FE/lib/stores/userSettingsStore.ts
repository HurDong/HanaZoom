import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 사용자 설정 타입 정의
export interface UserSettings {
  id?: string;
  memberId?: string;
  
  // 테마 설정
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  customCursorEnabled: boolean;
  emojiAnimationEnabled: boolean;
  
  // 알림 설정
  pushNotificationsEnabled: boolean;
  
  // 지도 설정
  defaultMapZoom: number;
  mapStyle: 'STANDARD' | 'SATELLITE' | 'HYBRID';
  
  // 차트 설정
  chartTheme: 'GREEN' | 'BLUE' | 'PURPLE' | 'ORANGE';
  chartAnimationSpeed: number;
  
  // 실시간 업데이트 설정
  autoRefreshInterval: number;
  
  // UI 밀도 설정
  uiDensity: 'COMPACT' | 'NORMAL' | 'COMFORTABLE';
  
  createdAt?: string;
  updatedAt?: string;
}

// 기본 설정값
const defaultSettings: UserSettings = {
  theme: 'SYSTEM',
  customCursorEnabled: true,
  emojiAnimationEnabled: true,
  pushNotificationsEnabled: true,
  defaultMapZoom: 8,
  mapStyle: 'STANDARD',
  chartTheme: 'GREEN',
  chartAnimationSpeed: 300,
  autoRefreshInterval: 300,
  uiDensity: 'NORMAL',
};

// 설정 업데이트 요청 타입
export interface UpdateUserSettingsRequest {
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  customCursorEnabled?: boolean;
  emojiAnimationEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  defaultMapZoom?: number;
  mapStyle?: 'STANDARD' | 'SATELLITE' | 'HYBRID';
  chartTheme?: 'GREEN' | 'BLUE' | 'PURPLE' | 'ORANGE';
  chartAnimationSpeed?: number;
  autoRefreshInterval?: number;
  uiDensity?: 'COMPACT' | 'NORMAL' | 'COMFORTABLE';
}

// 스토어 상태 타입
interface UserSettingsState {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// 스토어 액션 타입
interface UserSettingsActions {
  // 설정 로드
  loadSettings: (settings: UserSettings) => void;
  
  // 설정 업데이트
  updateSettings: (updates: UpdateUserSettingsRequest) => void;
  
  // 개별 설정 업데이트
  updateTheme: (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => void;
  updateCustomCursor: (enabled: boolean) => void;
  updateEmojiAnimation: (enabled: boolean) => void;
  updatePushNotifications: (enabled: boolean) => void;
  updateMapSettings: (zoom?: number, style?: 'STANDARD' | 'SATELLITE' | 'HYBRID') => void;
  updateChartSettings: (theme?: 'GREEN' | 'BLUE' | 'PURPLE' | 'ORANGE', speed?: number) => void;
  updateAutoRefresh: (interval: number) => void;
  updateUiDensity: (density: 'COMPACT' | 'NORMAL' | 'COMFORTABLE') => void;
  
  // 설정 초기화
  resetToDefaults: () => void;
  
  // 로딩 상태 관리
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

// 전체 스토어 타입
type UserSettingsStore = UserSettingsState & UserSettingsActions;

// Zustand 스토어 생성
export const useUserSettingsStore = create<UserSettingsStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      settings: defaultSettings,
      isLoading: false,
      error: null,
      isInitialized: false,

      // 설정 로드
      loadSettings: (settings: UserSettings) => {
        console.log('🔄 사용자 설정 로드:', settings);
        set({ 
          settings: { ...defaultSettings, ...settings },
          isInitialized: true,
          error: null 
        });
      },

      // 설정 업데이트
      updateSettings: (updates: UpdateUserSettingsRequest) => {
        console.log('🔄 사용자 설정 업데이트:', updates);
        set((state) => ({
          settings: { ...state.settings, ...updates },
          error: null
        }));
      },

      // 개별 설정 업데이트 메서드들
      updateTheme: (theme) => {
        console.log('🎨 테마 설정 업데이트:', theme);
        set((state) => ({
          settings: { ...state.settings, theme },
          error: null
        }));
      },

      updateCustomCursor: (enabled) => {
        console.log('🖱️ 커스텀 커서 설정 업데이트:', enabled);
        set((state) => ({
          settings: { ...state.settings, customCursorEnabled: enabled },
          error: null
        }));
      },

      updateEmojiAnimation: (enabled) => {
        console.log('✨ 이모지 애니메이션 설정 업데이트:', enabled);
        set((state) => ({
          settings: { ...state.settings, emojiAnimationEnabled: enabled },
          error: null
        }));
      },

      updatePushNotifications: (enabled) => {
        console.log('🔔 푸시 알림 설정 업데이트:', enabled);
        set((state) => ({
          settings: { ...state.settings, pushNotificationsEnabled: enabled },
          error: null
        }));
      },

      updateMapSettings: (zoom, style) => {
        console.log('🗺️ 지도 설정 업데이트:', { zoom, style });
        set((state) => ({
          settings: {
            ...state.settings,
            ...(zoom !== undefined && { defaultMapZoom: zoom }),
            ...(style !== undefined && { mapStyle: style })
          },
          error: null
        }));
      },

      updateChartSettings: (theme, speed) => {
        console.log('📊 차트 설정 업데이트:', { theme, speed });
        set((state) => ({
          settings: {
            ...state.settings,
            ...(theme !== undefined && { chartTheme: theme }),
            ...(speed !== undefined && { chartAnimationSpeed: speed })
          },
          error: null
        }));
      },

      updateAutoRefresh: (interval) => {
        console.log('🔄 자동 새로고침 설정 업데이트:', interval);
        set((state) => ({
          settings: { ...state.settings, autoRefreshInterval: interval },
          error: null
        }));
      },

      updateUiDensity: (density) => {
        console.log('📱 UI 밀도 설정 업데이트:', density);
        set((state) => ({
          settings: { ...state.settings, uiDensity: density },
          error: null
        }));
      },

      // 설정 초기화
      resetToDefaults: () => {
        console.log('🔄 설정을 기본값으로 초기화');
        set({
          settings: defaultSettings,
          error: null
        });
      },

      // 로딩 상태 관리
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        isInitialized: state.isInitialized,
      }),
      // 하이드레이션 후 초기화 상태 확인
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('✅ 사용자 설정 스토어 하이드레이션 완료');
          state.setInitialized(true);
        }
      },
    }
  )
);

// 편의 함수들
export const getUserSettings = () => useUserSettingsStore.getState().settings;
export const updateUserSettings = (updates: UpdateUserSettingsRequest) => 
  useUserSettingsStore.getState().updateSettings(updates);

// 설정별 편의 함수들
export const getTheme = () => useUserSettingsStore.getState().settings.theme;
export const getCustomCursorEnabled = () => useUserSettingsStore.getState().settings.customCursorEnabled;
export const getEmojiAnimationEnabled = () => useUserSettingsStore.getState().settings.emojiAnimationEnabled;
export const getPushNotificationsEnabled = () => useUserSettingsStore.getState().settings.pushNotificationsEnabled;
export const getMapSettings = () => ({
  zoom: useUserSettingsStore.getState().settings.defaultMapZoom,
  style: useUserSettingsStore.getState().settings.mapStyle
});
export const getChartSettings = () => ({
  theme: useUserSettingsStore.getState().settings.chartTheme,
  animationSpeed: useUserSettingsStore.getState().settings.chartAnimationSpeed
});
export const getAutoRefreshInterval = () => useUserSettingsStore.getState().settings.autoRefreshInterval;
export const getUiDensity = () => useUserSettingsStore.getState().settings.uiDensity;
