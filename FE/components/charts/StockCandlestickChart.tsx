"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartDataDto, ChartPeriod } from "@/types/chart";
import {
  getDailyChartData,
  getWeeklyChartData,
  getMonthlyChartData,
} from "@/lib/api/chart";
import { PeriodSelector } from "./PeriodSelector";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface StockCandlestickChartProps {
  stockSymbol: string;
  className?: string;
}

export function StockCandlestickChart({
  stockSymbol,
  className,
}: StockCandlestickChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("daily");
  const [chartData, setChartData] = useState<ChartDataDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 차트 데이터 로딩
  const loadChartData = async (period: ChartPeriod) => {
    setLoading(true);
    setError(null);

    try {
      let data: ChartDataDto[];

      switch (period) {
        case "daily":
          data = await getDailyChartData(stockSymbol, 2500); // 10년치
          break;
        case "weekly":
          data = await getWeeklyChartData(stockSymbol, 520); // 10년치
          break;
        case "monthly":
          data = await getMonthlyChartData(stockSymbol, 120); // 10년치
          break;
        default:
          data = await getDailyChartData(stockSymbol, 2500); // 10년치
      }

      // 날짜 순으로 정렬
      data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setChartData(data);
    } catch (err) {
      console.error("차트 데이터 로딩 실패:", err);
      setError(
        err instanceof Error ? err.message : "차트 데이터를 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 기간 변경 시 데이터 재로딩
  useEffect(() => {
    loadChartData(selectedPeriod);
  }, [selectedPeriod, stockSymbol]);

  // 차트 데이터 포맷팅
  const formatChartData = (data: ChartDataDto[]) => {
    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      }),
      open: item.openPrice,
      high: item.highPrice,
      low: item.lowPrice,
      close: item.closePrice,
      volume: item.volume,
      change: item.priceChange,
      changePercent: item.priceChangePercent,
    }));
  };

  const formattedData = formatChartData(chartData);

  // 가격 변화 색상 계산
  const getPriceChangeColor = (change: number) => {
    if (change > 0) return "text-red-600 dark:text-red-400";
    if (change < 0) return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-blue-600" />;
    return null;
  };

  if (loading) {
    return (
      <Card
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
            차트 로딩 중...
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-green-600">
              차트 데이터를 불러오는 중...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-red-200 dark:border-red-700 shadow-lg ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-lg font-bold text-red-800 dark:text-red-200">
            차트 로딩 실패
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => loadChartData(selectedPeriod)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            다시 시도
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg ${className}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
            {stockSymbol} 차트
          </CardTitle>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* 요약 정보 */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">시가</p>
              <p className="font-semibold">
                {chartData[0]?.openPrice?.toLocaleString()}원
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">현재가</p>
              <p className="font-semibold">
                {chartData[chartData.length - 1]?.closePrice?.toLocaleString()}
                원
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">변동</p>
              <div className="flex items-center justify-center gap-1">
                {getPriceChangeIcon(
                  chartData[chartData.length - 1]?.priceChange || 0
                )}
                <span
                  className={getPriceChangeColor(
                    chartData[chartData.length - 1]?.priceChange || 0
                  )}
                >
                  {chartData[
                    chartData.length - 1
                  ]?.priceChange?.toLocaleString()}
                  원
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">변동률</p>
              <span
                className={getPriceChangeColor(
                  chartData[chartData.length - 1]?.priceChange || 0
                )}
              >
                {chartData[chartData.length - 1]?.priceChangePercent?.toFixed(
                  2
                )}
                %
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            {/* 캔들스틱 차트 */}
            <div className="h-64">
              <ChartContainer
                config={{
                  open: { color: "#10b981" },
                  high: { color: "#ef4444" },
                  low: { color: "#3b82f6" },
                  close: { color: "#8b5cf6" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => `${value.toLocaleString()}원`}
                    />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()}원`,
                        name === "open"
                          ? "시가"
                          : name === "high"
                          ? "고가"
                          : name === "low"
                          ? "저가"
                          : "종가",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="open"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name="시가"
                    />
                    <Line
                      type="monotone"
                      dataKey="high"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                      name="고가"
                    />
                    <Line
                      type="monotone"
                      dataKey="low"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="저가"
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      name="종가"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* 거래량 차트 */}
            <div className="h-32">
              <ChartContainer
                config={{
                  volume: { color: "#10b981" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={10}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [
                        `${value.toLocaleString()}주`,
                        "거래량",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#10b981"
                      strokeWidth={1}
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="거래량"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            차트 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
