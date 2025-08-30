import api from "@/app/config/api";

export interface WatchlistItem {
  id: number;
  stockSymbol: string;
  stockName: string;
  stockLogoUrl?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  alertPrice?: number;
  alertType?: "ABOVE" | "BELOW" | "BOTH";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistRequest {
  stockSymbol: string;
  alertPrice?: number;
  alertType?: "ABOVE" | "BELOW" | "BOTH";
}

/**
 * 내 관심종목 목록 조회
 */
export async function getMyWatchlist(): Promise<WatchlistItem[]> {
  try {
    const response = await api.get("/watchlist");
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("관심종목 조회 실패:", error);
    return [];
  }
}

/**
 * 관심종목 추가
 */
export async function addToWatchlist(
  request: WatchlistRequest
): Promise<WatchlistItem | null> {
  try {
    const response = await api.post("/watchlist", request);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("관심종목 추가 실패:", error);
    throw error;
  }
}

/**
 * 관심종목 제거
 */
export async function removeFromWatchlist(
  stockSymbol: string
): Promise<boolean> {
  try {
    const response = await api.delete(`/watchlist/${stockSymbol}`);
    return response.data && response.data.success;
  } catch (error) {
    console.error("관심종목 제거 실패:", error);
    return false;
  }
}

/**
 * 특정 종목의 관심종목 여부 확인
 */
export async function checkIsInWatchlist(
  stockSymbol: string
): Promise<boolean> {
  try {
    const response = await api.get(`/watchlist/check/${stockSymbol}`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return false;
  } catch (error) {
    console.error("관심종목 확인 실패:", error);
    return false;
  }
}

/**
 * 관심종목 알림 설정 업데이트
 */
export async function updateWatchlistAlert(
  stockSymbol: string,
  request: WatchlistRequest
): Promise<WatchlistItem | null> {
  try {
    const response = await api.put(`/watchlist/${stockSymbol}/alert`, request);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("알림 설정 업데이트 실패:", error);
    throw error;
  }
}
