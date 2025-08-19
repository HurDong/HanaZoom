"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Calendar,
  Maximize2,
} from "lucide-react";
import { useState } from "react";

interface StockChartProps {
  stockCode: string;
}

export function StockChart({ stockCode }: StockChartProps) {
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("line");

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
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
            차트 분석
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stockCode}
            </Badge>
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
              className={`p-2 rounded transition-all ${
                chartType === "line"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`p-2 rounded transition-all ${
                chartType === "candle"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 차트 영역 (Placeholder) */}
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* 가짜 차트 시각화 */}
            <div className="flex items-end justify-center gap-1 mb-4">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-t transition-all duration-300 ${
                    i % 3 === 0
                      ? "bg-red-400 h-8"
                      : i % 2 === 0
                      ? "bg-green-400 h-6"
                      : "bg-gray-400 h-4"
                  }`}
                  style={{
                    height: `${20 + Math.random() * 40}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>

            <div className="space-y-2">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                차트 준비 중
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                TradingView 차트 연동이 곧 준비됩니다.
                <br />
                실시간 캔들차트, 기술적 지표 등을 제공할 예정입니다.
              </p>
            </div>

            {/* 현재 시간대 표시 */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{timeframe} 차트</span>
            </div>
          </div>
        </div>

        {/* 차트 정보 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">지표</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              이동평균선
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">패턴</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              분석 준비중
            </p>
          </div>
        </div>

        {/* 차트 액션 버튼들 */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled
          >
            기술적 지표
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled
          >
            패턴 분석
          </Button>
        </div>

        {/* 준비 중 안내 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 animate-pulse" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">개발 진행 중</span>
              <br />
              Phase 2에서 TradingView 차트가 연동될 예정입니다.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
