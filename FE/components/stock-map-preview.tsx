"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, TrendingDown } from "lucide-react";
import type { Region } from "@/types/map";

const regions: Region[] = [
  {
    id: "seoul",
    name: "서울",
    x: 41,
    y: 15,
    size: 18,
    topStocks: [
      { name: "삼성전자", symbol: "005930", change: 2.3, emoji: "📱" },
      { name: "NAVER", symbol: "035420", change: -1.2, emoji: "🔍" },
      { name: "카카오", symbol: "035720", change: 4.1, emoji: "💬" },
    ],
  },
  {
    id: "busan",
    name: "부산",
    x: 58,
    y: 55,
    size: 14,
    topStocks: [
      { name: "현대차", symbol: "005380", change: 1.8, emoji: "🚗" },
      { name: "기아", symbol: "000270", change: 2.1, emoji: "🚙" },
      { name: "LG에너지솔루션", symbol: "373220", change: 3.2, emoji: "🔋" },
    ],
  },
  {
    id: "daegu",
    name: "대구",
    x: 53,
    y: 40,
    size: 12,
    topStocks: [
      { name: "포스코", symbol: "005490", change: -1.2, emoji: "🏭" },
      { name: "포스코퓨처엠", symbol: "003670", change: 2.5, emoji: "🔧" },
      { name: "포스코인터내셔널", symbol: "047050", change: 1.8, emoji: "🌏" },
    ],
  },
  {
    id: "incheon",
    name: "인천",
    x: 40,
    y: 22,
    size: 13,
    topStocks: [
      { name: "SK하이닉스", symbol: "000660", change: 3.1, emoji: "💾" },
      { name: "SK이노베이션", symbol: "096770", change: -0.7, emoji: "⛽" },
      { name: "SK텔레콤", symbol: "017670", change: 1.2, emoji: "📱" },
    ],
  },
  {
    id: "gwangju",
    name: "광주",
    x: 40,
    y: 55,
    size: 11,
    topStocks: [
      { name: "LG화학", symbol: "051910", change: -0.7, emoji: "🧪" },
      { name: "LG전자", symbol: "066570", change: 2.3, emoji: "📺" },
      { name: "LG디스플레이", symbol: "034220", change: 1.5, emoji: "🖥️" },
    ],
  },
  {
    id: "daejeon",
    name: "대전",
    x: 42,
    y: 35,
    size: 12,
    topStocks: [
      { name: "카카오", symbol: "035720", change: 2.5, emoji: "💬" },
      { name: "한화시스템", symbol: "272210", change: 1.8, emoji: "🛰️" },
      {
        name: "한화에어로스페이스",
        symbol: "012450",
        change: 3.2,
        emoji: "✈️",
      },
    ],
  },
  {
    id: "jeju",
    name: "제주",
    x: 36,
    y: 81,
    size: 12,
    topStocks: [
      { name: "제주항공", symbol: "089590", change: 1.5, emoji: "✈️" },
      { name: "제주은행", symbol: "006220", change: 0.8, emoji: "🏦" },
      { name: "제주맥주", symbol: "004140", change: 2.1, emoji: "🍺" },
    ],
  },
];

export function StockMapPreview() {
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setPulseIndex((prev) => (prev + 1) % regions.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isHovering]);

  const handleRegionHover = (region: Region) => {
    setActiveRegion(region);
    setIsHovering(true);
    setSelectedStock(null);
  };

  const handleRegionLeave = () => {
    setIsHovering(false);
    setActiveRegion(null);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white/90 dark:bg-gray-900/90 border-green-200 dark:border-green-800 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full aspect-[16/9] bg-green-50 dark:bg-green-950 overflow-hidden">
          {/* 한국 지도 배경 */}
          <div className="absolute inset-0 bg-[url('/korea-map.svg')] bg-contain bg-center bg-no-repeat opacity-100 dark:opacity-80"></div>

          {/* 지역 구분선 */}
          <svg className="absolute inset-0 w-full h-full stroke-green-300 dark:stroke-green-700 fill-none">
            <path
              d="M 30 40 C 50 20, 70 25, 90 30"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <path
              d="M 40 50 C 60 45, 70 60, 80 70"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <path
              d="M 20 60 C 40 65, 50 70, 60 80"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <path
              d="M 70 40 C 75 50, 80 55, 90 60"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          </svg>

          {/* 지역 마커들 */}
          {regions.map((region, index) => (
            <div
              key={region.id}
              className={`absolute transition-all duration-300 ${
                activeRegion?.id === region.id ? "z-10" : "z-0"
              }`}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
            >
              {/* 마커 핀 */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  activeRegion?.id === region.id || pulseIndex === index
                    ? "scale-125"
                    : "scale-100 hover:scale-110"
                }`}
                onMouseEnter={() => handleRegionHover(region)}
                onMouseLeave={handleRegionLeave}
              >
                <MapPin
                  className={`w-${region.size} h-${region.size} text-green-600 dark:text-green-400 drop-shadow-md`}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                />
                <span
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-white font-bold text-xs"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {region.topStocks[0].emoji}
                </span>

                {/* 펄스 효과 */}
                {(activeRegion?.id === region.id || pulseIndex === index) && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-green-400/30 dark:bg-green-500/30"></div>
                )}
              </div>
            </div>
          ))}

          {/* 중앙에 표시되는 지역 정보 카드 */}
          {activeRegion && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 z-50"
              style={{
                width: "300px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={handleRegionLeave}
            >
              <div className="space-y-3">
                <Badge className="w-full justify-center text-sm py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {activeRegion.name} 인기 종목
                </Badge>

                <div className="space-y-2">
                  {activeRegion.topStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors duration-200 ${
                        selectedStock === stock.symbol
                          ? "bg-green-50 dark:bg-green-900/50"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onMouseEnter={() => setSelectedStock(stock.symbol)}
                      onMouseLeave={() => setSelectedStock(null)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{stock.emoji}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {stock.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {stock.symbol}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center space-x-1 ${
                          stock.change >= 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {Math.abs(stock.change)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
