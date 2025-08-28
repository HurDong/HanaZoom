"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Maximize2,
  Wifi,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";

interface TradingViewRealtimeChartProps {
  stockCode: string;
  className?: string;
}

interface ChartDataPoint {
  time: string;
  value: number;
}

export function TradingViewRealtimeChart({
  stockCode,
  className,
}: TradingViewRealtimeChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeframe, setTimeframe] = useState("1D");

  const {
    connected: isConnected,
    stockData,
    getStockData,
  } = useStockWebSocket({
    stockCodes: [stockCode],
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  const currentStockData = getStockData(stockCode);

  // 실시간 데이터 추가
  useEffect(() => {
    if (currentStockData) {
      const timestamp = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const price = parseFloat(currentStockData.currentPrice);

      const newDataPoint: ChartDataPoint = {
        time: timestamp,
        value: price,
      };

      // 차트 데이터 상태 업데이트 (최근 100개 포인트 유지)
      setChartData((prev) => {
        const newData = [...prev, newDataPoint];
        return newData.slice(-100);
      });
    }
  }, [currentStockData]);

  // 전체화면 토글
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  // 차트 새로고침
  const refreshChart = () => {
    setChartData([]);
  };

  // 가격 변화에 따른 색상 결정
  const getPriceColor = () => {
    if (!currentStockData) return "#6b7280";

    const currentPrice = parseFloat(currentStockData.currentPrice);
    const previousPrice = parseFloat(currentStockData.previousClose);

    if (currentPrice > previousPrice) return "#ef4444";
    if (currentPrice < previousPrice) return "#3b82f6";
    return "#6b7280";
  };

  // 가격 변화율 계산
  const getPriceChange = () => {
    if (!currentStockData) return { change: 0, changePercent: 0 };

    const currentPrice = parseFloat(currentStockData.currentPrice);
    const previousPrice = parseFloat(currentStockData.previousClose);
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    return { change, changePercent };
  };

  const { change, changePercent } = getPriceChange();

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              가격:{" "}
              <span className="font-medium">
                {payload[0].value?.toLocaleString()}원
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {stockCode} 실시간 차트
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={`text-xs ${
                isConnected ? "bg-green-600" : "bg-gray-500"
              }`}
            >
              <Wifi className="h-3 w-3 mr-1" />
              {isConnected ? "연결됨" : "연결안됨"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChart}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 실시간 가격 정보 */}
        {currentStockData && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span
                  className="text-2xl font-bold"
                  style={{ color: getPriceColor() }}
                >
                  {parseFloat(currentStockData.currentPrice).toLocaleString()}원
                </span>
              </div>
              <div className="flex items-center gap-2">
                {change > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                ) : change < 0 ? (
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                ) : null}
                <span
                  className={`text-lg font-semibold ${
                    change > 0
                      ? "text-red-600"
                      : change < 0
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {change.toLocaleString()}원
                </span>
                <span
                  className={`text-sm ${
                    change > 0
                      ? "text-red-600"
                      : change < 0
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  ({change > 0 ? "+" : ""}
                  {changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="text-right text-sm text-gray-500">
              <div>
                전일종가:{" "}
                {parseFloat(currentStockData.previousClose).toLocaleString()}원
              </div>
              <div>
                거래량: {parseInt(currentStockData.volume).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* 트레이딩뷰 스타일 실시간 차트 */}
        <div className="relative h-96 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:stroke-gray-600"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["dataMin - 100", "dataMax + 100"]}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 기준선 (전일종가) */}
                {currentStockData && (
                  <ReferenceLine
                    y={parseFloat(currentStockData.previousClose)}
                    stroke="#9ca3af"
                    strokeDasharray="2 2"
                    label={{ value: "전일종가", position: "right" }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={getPriceColor()}
                  strokeWidth={2}
                  dot={{ fill: getPriceColor(), strokeWidth: 1, r: 2 }}
                  activeDot={{ r: 4, stroke: getPriceColor(), strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>실시간 데이터를 기다리는 중...</p>
              </div>
            </div>
          )}
        </div>

        {/* 차트 통계 */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">최고가</div>
              <div className="font-semibold text-red-600">
                {Math.max(...chartData.map((d) => d.value)).toLocaleString()}원
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">최저가</div>
              <div className="font-semibold text-blue-600">
                {Math.min(...chartData.map((d) => d.value)).toLocaleString()}원
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">평균가</div>
              <div className="font-semibold">
                {(
                  chartData.reduce((sum, d) => sum + d.value, 0) /
                  chartData.length
                ).toLocaleString()}
                원
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">데이터 포인트</div>
              <div className="font-semibold">{chartData.length}개</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
