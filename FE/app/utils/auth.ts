import { create } from "zustand";

interface AuthStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

// 메모리에 accessToken을 저장하기 위한 store
export const useAuthStore = create<AuthStore>((set: any) => ({
  accessToken: null,
  setAccessToken: (token: string | null) => set({ accessToken: token }),
}));

export const setTokens = async (accessToken: string, refreshToken: string) => {
  // accessToken은 메모리에 저장
  useAuthStore.getState().setAccessToken(accessToken);

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
  // 메모리의 accessToken 제거
  useAuthStore.getState().setAccessToken(null);

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
