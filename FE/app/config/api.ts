import axios from "axios";

// axios 인스턴스 생성
export const api = axios.create({
  baseURL: "http://localhost:8080/api/v1", // 백엔드 서버 주소로 변경
  headers: {
    "Content-Type": "application/json",
  },
});

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // Auth
  login: "/members/login",
  signup: "/members/signup",
  logout: "/members/logout",
  refreshToken: "/members/refresh",

  // Regions
  regions: "/regions",

  // Stocks
  stockTicker: "/stocks/ticker",

  // Health Check
  health: "/health",
} as const;

// 응답 타입 정의
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// CORS 설정을 위한 인터셉터 추가
api.interceptors.request.use((config) => {
  config.withCredentials = true; // 쿠키를 포함한 요청을 위해 필요
  return config;
});

// 에러 핸들링 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 여기서 401, 403 등 공통 에러 처리 가능
    return Promise.reject(error);
  }
);
