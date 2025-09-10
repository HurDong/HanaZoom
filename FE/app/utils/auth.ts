import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { syncUserSettings } from "@/lib/api/userSettings";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface User {
  id: string;
  name: string;
  email: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
}

interface AuthActions {
  setAuth: (data: { accessToken: string; user: User }) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  getCurrentUserId: () => string | null;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => {
        set({ accessToken: null, user: null });
        // 사용자 설정도 초기화
        useUserSettingsStore.getState().resetToDefaults();
        console.log("✅ 인증 정보 및 사용자 설정 초기화 완료");
      },
      getCurrentUserId: () => {
        const state = get();
        if (state.user?.id) {
          return state.user.id;
        }

        // JWT 토큰에서 사용자 ID 추출 시도
        if (state.accessToken) {
          try {
            const payload = JSON.parse(atob(state.accessToken.split(".")[1]));
            return payload.sub || payload.userId || payload.id || null;
          } catch (error) {
            console.error("JWT 토큰 파싱 실패:", error);
            return null;
          }
        }

        return null;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      // 하이드레이션 이후 만료 토큰 자동 처리
      onRehydrateStorage: () => (state) => {
        try {
          const token = state?.accessToken;
          if (!token) return;

          const isExpired = (() => {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              const expMs = (payload?.exp ?? 0) * 1000;
              return Date.now() >= expMs;
            } catch {
              return true;
            }
          })();

          if (!isExpired) return;

          // 만료 시 즉시 갱신 시도, 실패하면 상태 초기화
          fetch("/api/auth/refresh-token", { credentials: "include" })
            .then(async (res) => {
              if (!res.ok) throw new Error("refresh failed");
              const data = await res.json();
              useAuthStore.getState().updateAccessToken(data.accessToken);
            })
            .catch(() => {
              useAuthStore.getState().clearAuth();
            });
        } catch {
          // 파싱 실패 등 -> 안전하게 초기화
          useAuthStore.getState().clearAuth();
        }
      },
    }
  )
);

export const setLoginData = async (
  accessToken: string,
  refreshToken: string,
  user: Omit<User, "latitude" | "longitude"> & {
    latitude?: string | number | null;
    longitude?: string | number | null;
  }
) => {
  console.log("🔄 setLoginData 시작:", {
    accessToken: accessToken?.substring(0, 20) + "...",
    refreshToken: refreshToken?.substring(0, 20) + "...",
  });

  // 좌표 데이터를 숫자로 변환
  const processedUser: User = {
    ...user,
    latitude: user.latitude ? Number(user.latitude) : null,
    longitude: user.longitude ? Number(user.longitude) : null,
  };

  // accessToken과 user 정보를 Zustand store에 저장
  useAuthStore.getState().setAuth({ accessToken, user: processedUser });
  console.log("✅ Zustand store에 인증 정보 저장 완료");

  // 사용자 설정 동기화
  try {
    console.log("🔄 사용자 설정 동기화 시작");
    const userSettings = await syncUserSettings();
    useUserSettingsStore.getState().loadSettings(userSettings);
    console.log("✅ 사용자 설정 동기화 완료:", userSettings);
  } catch (error) {
    console.error("❌ 사용자 설정 동기화 실패:", error);
    // 설정 동기화 실패해도 로그인은 계속 진행
    console.log("ℹ️ 기본 설정으로 계속 진행");
  }

  // refreshToken을 httpOnly 쿠키로 저장
  try {
    console.log("🔄 refreshToken 쿠키 저장 시도");
    const response = await fetch("/api/auth/set-refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include", // 쿠키를 포함하여 요청
    });

    if (!response.ok) {
      throw new Error(`쿠키 저장 실패: ${response.status}`);
    }

    console.log("✅ refreshToken 쿠키 저장 완료");
  } catch (error) {
    console.error("❌ Failed to set refresh token:", error);
    throw error; // 에러를 상위로 전파하여 적절한 처리 유도
  }
};

export const getAccessToken = () => {
  return useAuthStore.getState().accessToken;
};

export const refreshAccessToken = async () => {
  try {
    const response = await fetch("/api/auth/refresh-token", {
      credentials: "include", // 쿠키를 포함하여 요청
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Token refresh failed:", errorData);
      throw new Error(errorData.error || "Failed to refresh token");
    }

    const data = await response.json();

    if (!data.accessToken) {
      throw new Error("No access token received");
    }

    useAuthStore.getState().updateAccessToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    useAuthStore.getState().clearAuth();

    // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우에만)
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    // 서버에 로그아웃 요청
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
  } catch (error) {
    console.error("Failed to logout:", error);
  } finally {
    // 로컬 상태 초기화 (accessToken, user 정보만)
    useAuthStore.getState().clearAuth();
    // refreshToken 쿠키 제거
    await fetch("/api/auth/remove-refresh-token", {
      method: "POST",
      credentials: "include",
    });

    // 🎯 중요: 이메일 정보는 유지! 로그인 상태 유지 설정만 해제
    localStorage.removeItem("keepLoggedIn");
    // localStorage.removeItem("loginEmail"); // 이메일은 삭제하지 않음!
  }
};

export const isLoggedIn = () => {
  return !!useAuthStore.getState().accessToken;
};

export const shouldKeepLoggedIn = () => {
  return localStorage.getItem("keepLoggedIn") === "true";
};

export const getSavedLoginEmail = () => {
  return localStorage.getItem("loginEmail");
};

export const clearLoginPreferences = () => {
  localStorage.removeItem("keepLoggedIn");
  // localStorage.removeItem("loginEmail"); // 이메일은 삭제하지 않음!
};
