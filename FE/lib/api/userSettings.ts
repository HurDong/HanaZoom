import api from '@/app/config/api';
import { UserSettings, UpdateUserSettingsRequest } from '@/lib/stores/userSettingsStore';

const API_ENDPOINTS = {
  getUserSettings: '/user-settings',
  updateUserSettings: '/user-settings',
  updateTheme: '/user-settings/theme',
  updateCustomCursor: '/user-settings/cursor',
  updateEmojiAnimation: '/user-settings/emoji',
} as const;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * 사용자 설정 조회
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    console.log('🔍 사용자 설정 조회 요청');
    const response = await api.get<ApiResponse<UserSettings>>(API_ENDPOINTS.getUserSettings);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '사용자 설정 조회에 실패했습니다.');
    }
    
    console.log('✅ 사용자 설정 조회 성공:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ 사용자 설정 조회 실패:', error);
    throw new Error(error.response?.data?.message || error.message || '사용자 설정 조회에 실패했습니다.');
  }
};

/**
 * 사용자 설정 업데이트
 */
export const updateUserSettings = async (updates: UpdateUserSettingsRequest): Promise<UserSettings> => {
  try {
    console.log('🔄 사용자 설정 업데이트 요청:', updates);
    const response = await api.put<ApiResponse<UserSettings>>(API_ENDPOINTS.updateUserSettings, updates);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '사용자 설정 업데이트에 실패했습니다.');
    }
    
    console.log('✅ 사용자 설정 업데이트 성공:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ 사용자 설정 업데이트 실패:', error);
    throw new Error(error.response?.data?.message || error.message || '사용자 설정 업데이트에 실패했습니다.');
  }
};

/**
 * 테마 설정 업데이트
 */
export const updateTheme = async (theme: 'LIGHT' | 'DARK' | 'SYSTEM'): Promise<UserSettings> => {
  try {
    console.log('🎨 테마 설정 업데이트 요청:', theme);
    const response = await api.patch<ApiResponse<UserSettings>>(
      `${API_ENDPOINTS.updateTheme}?theme=${theme}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || '테마 설정 업데이트에 실패했습니다.');
    }
    
    console.log('✅ 테마 설정 업데이트 성공:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ 테마 설정 업데이트 실패:', error);
    throw new Error(error.response?.data?.message || error.message || '테마 설정 업데이트에 실패했습니다.');
  }
};

/**
 * 커스텀 커서 설정 업데이트
 */
export const updateCustomCursor = async (enabled: boolean): Promise<UserSettings> => {
  try {
    console.log('🖱️ 커스텀 커서 설정 업데이트 요청:', enabled);
    const response = await api.patch<ApiResponse<UserSettings>>(
      `${API_ENDPOINTS.updateCustomCursor}?enabled=${enabled}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || '커스텀 커서 설정 업데이트에 실패했습니다.');
    }
    
    console.log('✅ 커스텀 커서 설정 업데이트 성공:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ 커스텀 커서 설정 업데이트 실패:', error);
    throw new Error(error.response?.data?.message || error.message || '커스텀 커서 설정 업데이트에 실패했습니다.');
  }
};

/**
 * 이모지 애니메이션 설정 업데이트
 */
export const updateEmojiAnimation = async (enabled: boolean): Promise<UserSettings> => {
  try {
    console.log('✨ 이모지 애니메이션 설정 업데이트 요청:', enabled);
    const response = await api.patch<ApiResponse<UserSettings>>(
      `${API_ENDPOINTS.updateEmojiAnimation}?enabled=${enabled}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || '이모지 애니메이션 설정 업데이트에 실패했습니다.');
    }
    
    console.log('✅ 이모지 애니메이션 설정 업데이트 성공:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ 이모지 애니메이션 설정 업데이트 실패:', error);
    throw new Error(error.response?.data?.message || error.message || '이모지 애니메이션 설정 업데이트에 실패했습니다.');
  }
};

/**
 * 사용자 설정 동기화 (로그인 시 사용)
 */
export const syncUserSettings = async (): Promise<UserSettings> => {
  try {
    console.log('🔄 사용자 설정 동기화 시작');
    const settings = await getUserSettings();
    console.log('✅ 사용자 설정 동기화 완료:', settings);
    return settings;
  } catch (error: any) {
    console.error('❌ 사용자 설정 동기화 실패:', error);
    // 동기화 실패 시 기본 설정 사용
    console.log('ℹ️ 기본 설정으로 폴백');
    throw error;
  }
};
