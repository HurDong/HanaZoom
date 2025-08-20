import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
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
  // 좌표 데이터를 숫자로 변환
  const processedUser: User = {
    ...user,
    latitude: user.latitude ? Number(user.latitude) : null,
    longitude: user.longitude ? Number(user.longitude) : null,
  };

  // accessToken과 user 정보를 Zustand store에 저장
  useAuthStore.getState().setAuth({ accessToken, user: processedUser });

  // refreshToken을 httpOnly 쿠키로 저장
  try {
    await fetch("/api/auth/set-refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include", // 쿠키를 포함하여 요청
    });
  } catch (error) {
    console.error("Failed to set refresh token:", error);
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
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    useAuthStore.getState().updateAccessToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    useAuthStore.getState().clearAuth();
    window.location.href = "/login";
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
    // 로컬 상태 초기화
    useAuthStore.getState().clearAuth();
    // refreshToken 쿠키 제거
    await fetch("/api/auth/remove-refresh-token", {
      method: "POST",
      credentials: "include",
    });
    // 로그인 상태 유지 설정도 정리
    clearLoginPreferences();
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
  localStorage.removeItem("loginEmail");
};
