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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

interface StockChartProps {
  stockCode: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export function StockChart({ stockCode }: StockChartProps) {
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("line");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [maxDataPoints] = useState(50); // 최대 데이터 포인트 수
  const lastPriceRef = useRef<number>(0);

  // 실시간 웹소켓 데이터
  const {
    connected: wsConnected,
    stockData: wsStockData,
    getStockData,
    lastUpdate,
  } = useStockWebSocket({
    stockCodes: [stockCode],
    onStockUpdate: (data) => {
      updateChartData(data);
    },
    autoReconnect: true,
  });

  // 현재 종목 데이터
  const currentStockData = getStockData(stockCode);

  // 차트 데이터 업데이트 함수
  const updateChartData = (stockData: StockPriceData) => {
    const currentPrice = parseFloat(stockData.currentPrice);
    const changePrice = parseFloat(stockData.changePrice);
    const changeRate = parseFloat(stockData.changeRate);
    const volume = parseFloat(stockData.volume);
    const timestamp = parseInt(stockData.updatedTime);

    if (isNaN(currentPrice) || currentPrice <= 0) return;

    const newDataPoint: ChartDataPoint = {
      time: new Date(timestamp).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      timestamp,
      price: currentPrice,
      change: changePrice,
      changePercent: changeRate,
      volume,
    };

    setChartData((prevData) => {
      const newData = [...prevData, newDataPoint];
      // 최대 데이터 포인트 수 제한
      if (newData.length > maxDataPoints) {
        return newData.slice(-maxDataPoints);
      }
      return newData;
    });

    lastPriceRef.current = currentPrice;
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (currentStockData && chartData.length === 0) {
      updateChartData(currentStockData);
    }
  }, [currentStockData]);

  // 차트 색상 결정
  const getLineColor = () => {
    if (chartData.length < 2) return "#10b981"; // 기본 녹색
    
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    if (latest.price > previous.price) return "#ef4444"; // 상승 빨강
    if (latest.price < previous.price) return "#3b82f6"; // 하락 파랑
    return "#6b7280"; // 보합 회색
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            현재가: <span className="font-semibold">{data.price.toLocaleString()}원</span>
          </p>
          <p className={`text-sm font-semibold ${
            data.change >= 0 ? "text-red-600" : "text-blue-600"
          }`}>
            전일대비: {data.change >= 0 ? "+" : ""}{data.change.toLocaleString()}원 ({data.changePercent}%)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            거래량: {data.volume.toLocaleString()}주
          </p>
        </div>
      );
    }
    return null;
  };

  const timeframes = [
    { label: "1분", value: "1M" },
    { label: "5분", value: "5M" },
    { label: "15분", value: "15M" },
    { label: "1시간", value: "1H" },
    { label: "1일", value: "1D" },
    { label: "1주", value: "1W" },
    { label: "1달", value: "1MO" },
  ];

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              실시간 차트
            </CardTitle>
            <div className="flex items-center gap-1">
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">실시간</span>
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
              {stockCode}
            </Badge>
            {chartData.length > 0 && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  chartData[chartData.length - 1]?.change >= 0 
                    ? "text-red-600 border-red-200" 
                    : "text-blue-600 border-blue-200"
                }`}
              >
                {chartData.length}개 포인트
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="p-1">
              <Maximize2 className="w-4 h-4" />
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

          {/* 차트 타입 선택 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 rounded transition-all text-xs flex items-center gap-1 ${
                chartType === "line"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <LineChartIcon className="w-3 h-3" />
              실시간 틱
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`px-3 py-1 rounded transition-all text-xs flex items-center gap-1 ${
                chartType === "candle"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              캔들차트
            </button>
          </div>
        </div>

        {/* 실시간 차트 영역 */}
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
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
                  domain={['dataMin - 100', 'dataMax + 100']}
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
                  dataKey="price"
                  stroke={getLineColor()}
                  strokeWidth={2}
                  dot={{ fill: getLineColor(), strokeWidth: 1, r: 2 }}
                  activeDot={{ r: 4, stroke: getLineColor(), strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="flex items-end justify-center gap-1 mb-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 bg-green-400 rounded-t animate-pulse"
                      style={{
                        height: `${20 + (i % 3) * 15}px`,
                        animationDelay: `${i * 200}ms`,
                      }}
                    />
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Activity className="w-8 h-8 text-green-500 mx-auto animate-pulse" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    실시간 데이터 수신 중...
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    웹소켓 연결 후 차트가 자동으로 생성됩니다
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 차트 정보 */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">데이터 포인트</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {chartData.length}개
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">업데이트</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {lastUpdate > 0 ? `${Math.floor((Date.now() - lastUpdate) / 1000)}초 전` : "-"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">추세</p>
            <p className={`text-sm font-semibold flex items-center justify-center gap-1 ${
              chartData.length > 1 
                ? chartData[chartData.length - 1]?.price > chartData[0]?.price 
                  ? "text-red-600" 
                  : "text-blue-600"
                : "text-gray-500"
            }`}>
              {chartData.length > 1 ? (
                chartData[chartData.length - 1]?.price > chartData[0]?.price ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    상승
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 rotate-180" />
                    하락
                  </>
                )
              ) : (
                "대기중"
              )}
            </p>
          </div>
        </div>

        {/* 차트 액션 버튼들 */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setChartData([])}
            disabled={chartData.length === 0}
          >
            차트 초기화
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled
          >
            화면 확대
          </Button>
        </div>

        {/* 실시간 상태 안내 */}
        {wsConnected ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 animate-pulse" />
              <div className="text-xs text-green-800 dark:text-green-200">
                <span className="font-semibold">실시간 연결 중</span>
                <br />
                KIS 웹소켓을 통해 실시간 주식 데이터를 수신하고 있습니다.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 animate-pulse" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <span className="font-semibold">웹소켓 연결 중</span>
                <br />
                실시간 데이터 수신을 위해 연결 중입니다...
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
