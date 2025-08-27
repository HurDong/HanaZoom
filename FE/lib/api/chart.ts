import { ChartDataDto } from "@/types/chart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * 일봉 차트 데이터 조회
 */
export async function getDailyChartData(
  stockSymbol: string,
  days: number = 30
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
  weeks: number = 12
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
  months: number = 12
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
