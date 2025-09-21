import { ChartDataDto, CandleData } from "@/types/chart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * 차트 데이터 조회 (시간봉별)
 */
export async function getChartData(
  stockCode: string,
  timeframe: string = "1D",
  limit: number = 100
): Promise<CandleData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stocks/chart/${stockCode}?timeframe=${timeframe}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("차트 데이터 조회 실패:", error);
    throw error;
  }
}

/**
 * 현재 진행 중인 캔들 조회
 */
export async function getCurrentCandle(
  stockCode: string,
  timeframe: string = "1D"
): Promise<CandleData | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stocks/chart/${stockCode}/current?timeframe=${timeframe}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error("현재 캔들 조회 실패:", error);
    throw error;
  }
}

/**
 * 캔들 데이터를 차트용으로 포맷팅
 */
export function formatCandleForChart(candle: CandleData): any {
  return {
    time: candle.dateTime || new Date(candle.timestamp).toISOString(),
    timestamp: candle.timestamp,
    open: parseFloat(candle.openPrice || "0"),
    high: parseFloat(candle.highPrice || "0"),
    low: parseFloat(candle.lowPrice || "0"),
    close: parseFloat(candle.closePrice || "0"),
    volume: parseInt(candle.volume || "0"),
    change: parseFloat(candle.changePrice || "0"),
    changePercent: parseFloat(candle.changeRate || "0"),
    isComplete: candle.isComplete || false,
  };
}

/**
 * 일봉 차트 데이터 조회
 */
export async function getDailyChartData(
  stockSymbol: string,
  days: number = 2500 // 약 10년치 (250일 * 10년)
): Promise<ChartDataDto[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/charts/daily/${stockSymbol}?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("일봉 차트 데이터 조회 실패:", error);
    throw error;
  }
}

/**
 * 주봉 차트 데이터 조회
 */
export async function getWeeklyChartData(
  stockSymbol: string,
  weeks: number = 520 // 약 10년치 (52주 * 10년)
): Promise<ChartDataDto[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/charts/weekly/${stockSymbol}?weeks=${weeks}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("주봉 차트 데이터 조회 실패:", error);
    throw error;
  }
}

/**
 * 월봉 차트 데이터 조회
 */
export async function getMonthlyChartData(
  stockSymbol: string,
  months: number = 120 // 약 10년치 (12개월 * 10년)
): Promise<ChartDataDto[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/charts/monthly/${stockSymbol}?months=${months}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("월봉 차트 데이터 조회 실패:", error);
    throw error;
  }
}
