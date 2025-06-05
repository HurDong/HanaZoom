"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, TrendingDown } from "lucide-react"

interface Region {
  id: string
  name: string
  x: number
  y: number
  size: number
  topStock: {
    name: string
    symbol: string
    change: number
    emoji: string
  }
}

const regions: Region[] = [
  {
    id: "seoul",
    name: "서울",
    x: 60,
    y: 30,
    size: 18,
    topStock: { name: "삼성전자", symbol: "005930", change: 2.3, emoji: "📱" },
  },
  {
    id: "busan",
    name: "부산",
    x: 85,
    y: 80,
    size: 14,
    topStock: { name: "현대차", symbol: "005380", change: 1.8, emoji: "🚗" },
  },
  {
    id: "daegu",
    name: "대구",
    x: 75,
    y: 60,
    size: 12,
    topStock: { name: "NAVER", symbol: "035420", change: -1.2, emoji: "🔍" },
  },
  {
    id: "incheon",
    name: "인천",
    x: 40,
    y: 35,
    size: 13,
    topStock: { name: "SK하이닉스", symbol: "000660", change: 3.1, emoji: "💾" },
  },
  {
    id: "gwangju",
    name: "광주",
    x: 40,
    y: 75,
    size: 11,
    topStock: { name: "LG화학", symbol: "051910", change: -0.7, emoji: "🧪" },
  },
  {
    id: "daejeon",
    name: "대전",
    x: 60,
    y: 55,
    size: 12,
    topStock: { name: "카카오", symbol: "035720", change: 2.5, emoji: "💬" },
  },
]

export function StockMapPreview() {
  const [activeRegion, setActiveRegion] = useState<Region | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [pulseIndex, setPulseIndex] = useState(0)

  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setPulseIndex((prev) => (prev + 1) % regions.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isHovering])

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 border-green-200 dark:border-green-800 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full aspect-[4/3] bg-green-50 dark:bg-green-950 overflow-hidden">
          {/* 지도 배경 */}
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=600')] bg-cover opacity-20"></div>

          {/* 지역 구분선 */}
          <svg className="absolute inset-0 w-full h-full stroke-green-300 dark:stroke-green-700 fill-none">
            <path d="M 30 40 C 50 20, 70 25, 90 30" strokeWidth="1" strokeDasharray="3,3" />
            <path d="M 40 50 C 60 45, 70 60, 80 70" strokeWidth="1" strokeDasharray="3,3" />
            <path d="M 20 60 C 40 65, 50 70, 60 80" strokeWidth="1" strokeDasharray="3,3" />
            <path d="M 70 40 C 75 50, 80 55, 90 60" strokeWidth="1" strokeDasharray="3,3" />
          </svg>

          {/* 지역 마커들 */}
          {regions.map((region, index) => (
            <div
              key={region.id}
              className={`absolute cursor-pointer transition-all duration-300 ${
                activeRegion?.id === region.id ? "z-10" : "z-0"
              }`}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              onMouseEnter={() => {
                setActiveRegion(region)
                setIsHovering(true)
              }}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* 마커 핀 */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  activeRegion?.id === region.id || pulseIndex === index ? "scale-125" : "scale-100 hover:scale-110"
                }`}
              >
                <MapPin
                  className={`w-${region.size} h-${region.size} text-green-600 dark:text-green-400 drop-shadow-md`}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                />
                <span
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-white font-bold text-xs"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {region.topStock.emoji}
                </span>

                {/* 펄스 효과 */}
                {(activeRegion?.id === region.id || pulseIndex === index) && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-green-400/30 dark:bg-green-500/30"></div>
                )}
              </div>

              {/* 지역 이름 */}
              <div
                className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs font-medium text-green-800 dark:text-green-200 bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 rounded-full shadow-sm transition-all duration-300 ${
                  activeRegion?.id === region.id ? "opacity-100" : "opacity-70"
                }`}
              >
                {region.name}
              </div>
            </div>
          ))}

          {/* 활성화된 지역 정보 */}
          {activeRegion && (
            <div
              className="absolute p-2 bg-white/90 dark:bg-gray-900/90 border border-green-200 dark:border-green-700 rounded-lg shadow-lg transition-all duration-300 z-20"
              style={{
                left: `${activeRegion.x}%`,
                top: `${activeRegion.y - 15}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="text-center">
                <Badge
                  className={`mb-1 ${
                    activeRegion.topStock.change >= 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {activeRegion.name} 인기 종목
                </Badge>
                <div className="flex items-center justify-center gap-1 font-medium text-green-900 dark:text-green-100">
                  <span>{activeRegion.topStock.emoji}</span>
                  <span>{activeRegion.topStock.name}</span>
                </div>
                <div
                  className={`flex items-center justify-center text-sm ${
                    activeRegion.topStock.change >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {activeRegion.topStock.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {activeRegion.topStock.change >= 0 ? "+" : ""}
                  {activeRegion.topStock.change}%
                </div>
              </div>
            </div>
          )}

          {/* 범례 */}
          <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded px-2 py-1 text-xs text-green-800 dark:text-green-200 shadow-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span>지역별 인기 종목</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
