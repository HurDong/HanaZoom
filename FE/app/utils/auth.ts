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

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAuth: (data: { accessToken: string; user: User }) => void;
  clearAuth: () => void;
}

// Zustand 스토어를 생성합니다. `persist` 미들웨어를 사용하여 localStorage에 상태를 저장합니다.
export const useAuthStore = create(
  persist<AuthStore>(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "auth-storage", // localStorage에 저장될 때 사용될 키 이름
      storage: createJSONStorage(() => localStorage), // localStorage를 사용하도록 설정
    }
  )
);

export const setLoginData = async (
  accessToken: string,
  refreshToken: string,
  user: User
) => {
  // accessToken과 user 정보는 Zustand store에 저장 (persist 미들웨어에 의해 localStorage에도 저장됨)
  useAuthStore.getState().setAuth({ accessToken, user });

  // refreshToken은 httpOnly 쿠키로 저장하기 위해 서버에 요청
  try {
    await fetch("/api/auth/set-refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    console.error("Failed to set refresh token:", error);
  }
};

export const getAccessToken = () => {
  return useAuthStore.getState().accessToken;
};

export const getRefreshToken = async () => {
  try {
    const response = await fetch("/api/auth/refresh-token");
    if (!response.ok) return null;
    const data = await response.json();
    return data.refreshToken;
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
};

export const removeTokens = async () => {
  // 메모리와 localStorage의 상태 제거
  useAuthStore.getState().clearAuth();

  // refreshToken 쿠키 제거
  try {
    await fetch("/api/auth/remove-refresh-token", {
      method: "POST",
    });
  } catch (error) {
    console.error("Failed to remove refresh token:", error);
  }
};

export const isLoggedIn = () => {
  return !!useAuthStore.getState().accessToken;
};

export const isLoggingOut = () => {
  return false; // 더 이상 필요하지 않으므로 제거
};
