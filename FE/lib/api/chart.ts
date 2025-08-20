import api, { API_ENDPOINTS } from "@/app/config/api";

export interface CandleData {
  stockCode: string;
  dateTime: string;
  timeframe: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  changePrice: string;
  changeRate: string;
  changeSign: string;
  isComplete: boolean;
  timestamp: number;
}

export interface ChartApiResponse {
  success: boolean;
  data: CandleData[];
  message: string;
}

/**
 * 과거 캔들 데이터 조회
 */
export const getChartData = async (
  stockCode: string,
  timeframe: string = "1D",
  limit: number = 100
): Promise<CandleData[]> => {
  const response = await api.get<ChartApiResponse>(
    `/api/v1/stocks/chart/${stockCode}?timeframe=${timeframe}&limit=${limit}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "차트 데이터 조회에 실패했습니다.");
  }

  return response.data.data;
};

/**
 * 현재 진행 중인 캔들 조회
 */
export const getCurrentCandle = async (
  stockCode: string,
  timeframe: string = "1D"
): Promise<CandleData> => {
  const response = await api.get<{ success: boolean; data: CandleData; message: string }>(
    `/api/v1/stocks/chart/${stockCode}/current?timeframe=${timeframe}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "현재 캔들 조회에 실패했습니다.");
  }

  return response.data.data;
};

/**
 * 지원하는 시간봉 목록 조회
 */
export const getSupportedTimeframes = async (): Promise<string[]> => {
  const response = await api.get<{ success: boolean; data: string[]; message: string }>(
    "/api/v1/stocks/chart/timeframes"
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "시간봉 목록 조회에 실패했습니다.");
  }

  return response.data.data;
};

/**
 * 캔들 데이터를 차트용 포맷으로 변환
 */
export const formatCandleForChart = (candle: CandleData) => {
  return {
    time: new Date(candle.timestamp).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      ...(candle.timeframe.includes("M") || candle.timeframe.includes("H") ? { second: "2-digit" } : {}),
    }),
    timestamp: candle.timestamp,
    open: parseFloat(candle.openPrice),
    high: parseFloat(candle.highPrice),
    low: parseFloat(candle.lowPrice),
    close: parseFloat(candle.closePrice),
    volume: parseFloat(candle.volume),
    change: parseFloat(candle.changePrice),
    changePercent: parseFloat(candle.changeRate),
    isComplete: candle.isComplete,
  };
};
