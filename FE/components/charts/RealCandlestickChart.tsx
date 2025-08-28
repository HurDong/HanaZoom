"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartDataDto } from "@/types/chart";
import { PeriodSelector } from "./PeriodSelector";
import { ChartDataStatus } from "./ChartDataStatus";
import { ChartSummary } from "./ChartSummary";
import { useChartData } from "@/hooks/useChartData";
import { Loader2 } from "lucide-react";

interface RealCandlestickChartProps {
  stockSymbol: string;
  className?: string;
}

export function RealCandlestickChart({
  stockSymbol,
  className,
}: RealCandlestickChartProps) {
  const {
    chartData,
    loading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    refreshData,
  } = useChartData(stockSymbol);

  // 캔들스틱 데이터 포맷팅
  const formatCandlestickData = (data: ChartDataDto[]) => {
    return data.map((item) => {
      const open = item.openPrice;
      const close = item.closePrice;
      const high = item.highPrice;
      const low = item.lowPrice;

      // 캔들스틱 색상 결정 (시가 > 종가: 빨강, 시가 < 종가: 파랑)
      const isPositive = close >= open;

      // 캔들스틱 높이와 위치 계산
      const bodyHeight = Math.abs(close - open);

      return {
        date: new Date(item.date).toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }),
        open,
        high,
        low,
        close,
        volume: item.volume,
        change: item.priceChange,
        changePercent: item.priceChangePercent,
        // 캔들스틱 렌더링을 위한 값들
        bodyHeight,
        isPositive,
        // 고가-저가 선을 위한 값
        highLowHeight: high - low,
      };
    });
  };

  const formattedData = formatCandlestickData(chartData);

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
            onClick={refreshData}
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
            {stockSymbol} 주/일/월봉 차트
          </CardTitle>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* 요약 정보 */}
        {chartData.length > 0 && (
          <ChartSummary data={chartData} className="mb-4" />
        )}
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            {/* 캔들스틱 차트 */}
            <div className="h-64">
              <ChartContainer
                config={{
                  positive: { color: "#ef4444" },
                  negative: { color: "#3b82f6" },
                  volume: { color: "#10b981" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={formattedData}>
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
                          : name === "close"
                          ? "종가"
                          : "거래량",
                      ]}
                    />

                    {/* 고가-저가 선 (wick) */}
                    <Bar
                      dataKey="highLowHeight"
                      fill="transparent"
                      stroke="#6b7280"
                      strokeWidth={1}
                      name="고가-저가"
                    />

                    {/* 캔들스틱 몸통 */}
                    <Bar dataKey="bodyHeight" fill="#cccccc" name="시가-종가">
                      {formattedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isPositive ? "#ef4444" : "#3b82f6"}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
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
                  <ComposedChart data={formattedData}>
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
                    <Bar
                      dataKey="volume"
                      fill="#10b981"
                      fillOpacity={0.7}
                      name="거래량"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <ChartDataStatus
            period={selectedPeriod}
            dataCount={chartData.length}
          />
        )}
      </CardContent>
    </Card>
  );
}
