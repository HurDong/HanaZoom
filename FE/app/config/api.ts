// API 기본 URL 설정
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://54.180.109.147:8080";

// API 엔드포인트 설정
export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  login: `${API_BASE_URL}/api/members/login`,
  signup: `${API_BASE_URL}/api/members/signup`,
} as const;
