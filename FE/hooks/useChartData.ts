import { useState, useEffect, useCallback } from "react";
import { ChartDataDto, ChartPeriod } from "@/types/chart";
import {
  getDailyChartData,
  getWeeklyChartData,
  getMonthlyChartData,
} from "@/lib/api/chart";

interface UseChartDataReturn {
  chartData: ChartDataDto[];
  loading: boolean;
  error: string | null;
  selectedPeriod: ChartPeriod;
  setSelectedPeriod: (period: ChartPeriod) => void;
  refreshData: () => void;
  dataCount: number;
}

export function useChartData(stockSymbol: string): UseChartDataReturn {
  const [chartData, setChartData] = useState<ChartDataDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("daily");

  const loadChartData = useCallback(
    async (period: ChartPeriod) => {
      if (!stockSymbol) return;

      setLoading(true);
      setError(null);

      try {
        let data: ChartDataDto[];

        switch (period) {
          case "daily":
            data = await getDailyChartData(stockSymbol, 30);
            break;
          case "weekly":
            data = await getWeeklyChartData(stockSymbol, 12);
            break;
          case "monthly":
            data = await getMonthlyChartData(stockSymbol, 12);
            break;
          default:
            data = await getDailyChartData(stockSymbol, 30);
        }

        // 날짜 순으로 정렬
        data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setChartData(data);
      } catch (err) {
        console.error("차트 데이터 로딩 실패:", err);
        setError(
          err instanceof Error
            ? err.message
            : "차트 데이터를 불러올 수 없습니다."
        );
        setChartData([]);
      } finally {
        setLoading(false);
      }
    },
    [stockSymbol]
  );

  const refreshData = useCallback(() => {
    loadChartData(selectedPeriod);
  }, [loadChartData, selectedPeriod]);

  // 기간 변경 시 데이터 재로딩
  useEffect(() => {
    loadChartData(selectedPeriod);
  }, [selectedPeriod, loadChartData]);

  // 종목 변경 시 데이터 재로딩
  useEffect(() => {
    if (stockSymbol) {
      loadChartData(selectedPeriod);
    }
  }, [stockSymbol, loadChartData, selectedPeriod]);

  return {
    chartData,
    loading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    refreshData,
    dataCount: chartData.length,
  };
}
