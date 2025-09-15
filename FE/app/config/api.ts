import axios from "axios";
import { getAccessToken, refreshAccessToken } from "@/app/utils/auth";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    const url: string = (config.url as string) || "";
    const isAuthFree =
      url.includes("/members/login") ||
      url.includes("/members/signup") ||
      url.includes("/members/kakao-login") ||
      url.includes("/members/refresh") ||
      url.includes("/members/refresh-token");

    const token = getAccessToken();
    if (token && !isAuthFree) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 API 요청에 토큰 추가 - URL:", url, "토큰 존재:", !!token, "토큰 길이:", token.length);
    } else if (!isAuthFree) {
      console.log("⚠️ API 요청에 토큰 없음 - URL:", url, "토큰 존재:", !!token);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
// 토큰 갱신을 기다리는 요청들의 큐
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

// 토큰 갱신이 완료되면 큐에 있는 요청들을 처리
const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 토큰이 만료되었을 때 (401 에러) 또는 보안단에서 차단된 403도 동일 흐름 처리
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      // 로그인/리프레시 호출 자체에서는 재시도 루프를 방지
      const requestUrl: string = (originalRequest?.url as string) || "";
      if (
        requestUrl.includes("/members/login") ||
        requestUrl.includes("/members/refresh") ||
        requestUrl.includes("/members/refresh-token")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 토큰 갱신 중이면 큐에 요청을 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();
        processQueue();
        originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // Auth
  login: "/members/login",
  signup: "/members/signup",
  logout: "/members/logout",
  refreshToken: "/members/refresh-token",
  kakaoLogin: "/members/kakao-login",

  // Regions
  regions: "/regions",

  // Stocks
  stockTicker: "/stocks/ticker",
  stockSearch: "/stocks/search",
  stockRealtime: "/stocks/realtime",
  stockOrderbook: "/stocks/orderbook",

  // Watchlist
  watchlist: "/watchlist",
  watchlistCheck: "/watchlist/check",

  // Health Check
  health: "/health",
} as const;

// 응답 타입 정의
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
