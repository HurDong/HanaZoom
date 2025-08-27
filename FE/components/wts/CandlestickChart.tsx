"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart as LineChartIcon,
  BarChart3,
  TrendingUp,
  Calendar,
  Maximize2,
  Activity,
  Wifi,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import {
  getChartData,
  getCurrentCandle,
  formatCandleForChart,
} from "@/lib/api/chart";
import type { CandleData } from "@/types/chart";
import type { StockPriceData } from "@/lib/api/stock";

interface CandlestickChartProps {
  stockCode: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  isComplete: boolean;
}

export function CandlestickChart({ stockCode }: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("candle");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentCandleRef = useRef<ChartDataPoint | null>(null);

  // 실시간 웹소켓 데이터
  const {
    connected: wsConnected,
    getStockData,
    lastUpdate,
  } = useStockWebSocket({
    stockCodes: [stockCode],
    onStockUpdate: (data) => {
      updateCurrentCandle(data);
    },
    autoReconnect: true,
  });

  const timeframes = [
    { label: "1분", value: "1M" },
    { label: "5분", value: "5M" },
    { label: "15분", value: "15M" },
    { label: "1시간", value: "1H" },
    { label: "1일", value: "1D" },
    { label: "1주", value: "1W" },
    { label: "1달", value: "1MO" },
  ];

  // 과거 차트 데이터 로드
  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 과거 캔들 데이터 조회 - 더 많은 데이터 요청
      const dataLimit =
        timeframe === "1D" ? 1000 : timeframe === "1W" ? 200 : 100; // 일봉: 3년, 주봉: 4년, 기타: 기본값
      const pastCandles = await getChartData(stockCode, timeframe, dataLimit);

      // 현재 캔들 데이터 조회 - 임시 비활성화 (Redis 직렬화 문제)
      // let currentCandle = null;
      // try {
      //   currentCandle = await getCurrentCandle(stockCode, timeframe);
      // } catch (currentError) {
      //   console.warn("현재 캔들 조회 실패, 과거 데이터만 표시:", currentError);
      // }

      // 차트 데이터 포맷 변환
      const formattedData = pastCandles.map(formatCandleForChart);

      // 현재 캔들이 있고 완성되지 않았으면 추가
      // if (currentCandle && !currentCandle.isComplete) {
      //   const formattedCurrent = formatCandleForChart(currentCandle);
      //   formattedData.push(formattedCurrent);
      //   currentCandleRef.current = formattedCurrent;
      // }

      setChartData(formattedData);
      console.log(
        "✅ 기본 차트 데이터 로드 완료:",
        formattedData.length,
        "개 캔들"
      );
    } catch (err) {
      console.error("차트 데이터 로드 실패:", err);
      setError(
        err instanceof Error ? err.message : "차트 데이터를 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 실시간 데이터로 현재 캔들 업데이트
  const updateCurrentCandle = (stockData: StockPriceData) => {
    if (!currentCandleRef.current) return;

    const currentPrice = parseFloat(stockData.currentPrice);
    const volume = parseFloat(stockData.volume);

    setChartData((prevData) => {
      const newData = [...prevData];
      const lastIndex = newData.length - 1;

      if (lastIndex >= 0 && !newData[lastIndex].isComplete) {
        // 현재 진행 중인 캔들 업데이트
        const currentCandle = { ...newData[lastIndex] };

        currentCandle.close = currentPrice;
        currentCandle.high = Math.max(currentCandle.high, currentPrice);
        currentCandle.low = Math.min(currentCandle.low, currentPrice);
        currentCandle.volume = volume;
        currentCandle.change = currentPrice - currentCandle.open;
        currentCandle.changePercent =
          ((currentPrice - currentCandle.open) / currentCandle.open) * 100;
        currentCandle.timestamp = parseInt(stockData.updatedTime);

        newData[lastIndex] = currentCandle;
        currentCandleRef.current = currentCandle;
      }

      return newData;
    });
  };

  // 시간봉 변경 시 데이터 재로드
  useEffect(() => {
    if (stockCode) {
      loadChartData();
    }
  }, [stockCode, timeframe]);

  // 캔들스틱 색상 결정
  const getCandleColor = (dataPoint: ChartDataPoint) => {
    return dataPoint.close >= dataPoint.open ? "#ef4444" : "#3b82f6"; // 상승: 빨강, 하락: 파랑
  };

  // 커스텀 캔들스틱 컴포넌트
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isUp = close >= open;
    const color = isUp ? "#ef4444" : "#3b82f6";

    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(open, close);

    return (
      <g>
        {/* 심지 (고가-저가) */}
        <line
          x1={x + width / 2}
          y1={y + ((high - Math.max(open, close)) * height) / (high - low)}
          x2={x + width / 2}
          y2={y + ((high - Math.min(open, close)) * height) / (high - low)}
          stroke={color}
          strokeWidth={1}
        />

        {/* 몸통 (시가-종가) */}
        <rect
          x={x + width * 0.2}
          y={y + ((high - Math.max(open, close)) * height) / (high - low)}
          width={width * 0.6}
          height={(bodyHeight * height) / (high - low)}
          fill={isUp ? color : "white"}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </p>
          <div className="space-y-1 text-xs">
            <p>
              시가:{" "}
              <span className="font-semibold">
                {data.open.toLocaleString()}원
              </span>
            </p>
            <p>
              고가:{" "}
              <span className="font-semibold text-red-600">
                {data.high.toLocaleString()}원
              </span>
            </p>
            <p>
              저가:{" "}
              <span className="font-semibold text-blue-600">
                {data.low.toLocaleString()}원
              </span>
            </p>
            <p>
              종가:{" "}
              <span className="font-semibold">
                {data.close.toLocaleString()}원
              </span>
            </p>
            <p
              className={`font-semibold ${
                data.change >= 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              전일대비: {data.change >= 0 ? "+" : ""}
              {data.change.toFixed(0)}원 ({data.changePercent.toFixed(2)}%)
            </p>
            <p>
              거래량:{" "}
              <span className="font-semibold">
                {data.volume.toLocaleString()}주
              </span>
            </p>
            {!data.isComplete && <p className="text-yellow-600">진행중</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-green-500 mx-auto animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              차트 데이터 로딩 중...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadChartData} variant="outline" size="sm">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              캔들 차트
            </CardTitle>
            <div className="flex items-center gap-1">
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    실시간
                  </span>
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">연결중...</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {timeframe}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {chartData.length}개 캔들
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={loadChartData}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 차트 컨트롤 */}
        <div className="flex flex-wrap gap-2">
          {/* 시간대 선택 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  timeframe === tf.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 캔들 차트 영역 */}
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
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

                {/* 고가-저가 라인 */}
                {chartData.map((entry, index) => (
                  <Line
                    key={`line-${index}`}
                    type="monotone"
                    dataKey="high"
                    stroke="transparent"
                    dot={false}
                    activeDot={false}
                  />
                ))}

                {/* 캔들스틱 몸통 */}
                <Bar
                  dataKey={(entry) => Math.abs(entry.close - entry.open)}
                  fill={(entry) => getCandleColor(entry)}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Activity className="w-8 h-8 text-green-500 mx-auto animate-pulse" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  차트 데이터 준비 중...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 차트 정보 */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">캔들 수</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {chartData.length}개
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">시간봉</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {timeframes.find((tf) => tf.value === timeframe)?.label ||
                timeframe}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">업데이트</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {lastUpdate > 0
                ? `${Math.floor((Date.now() - lastUpdate) / 1000)}초 전`
                : "-"}
            </p>
          </div>
        </div>

        {/* 실시간 상태 안내 */}
        {wsConnected ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 animate-pulse" />
              <div className="text-xs text-green-800 dark:text-green-200">
                <span className="font-semibold">
                  과거 데이터 + 실시간 업데이트
                </span>
                <br />
                {timeframes.find((tf) => tf.value === timeframe)?.label}{" "}
                캔들차트가 실시간으로 업데이트됩니다.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 animate-pulse" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <span className="font-semibold">과거 데이터 로드 완료</span>
                <br />
                실시간 업데이트를 위해 웹소켓 연결 중...
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
