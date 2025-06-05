"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  emoji: string
}

const mockStocks: StockData[] = [
  { symbol: "005930", name: "삼성전자", price: 71500, change: 2.3, emoji: "📱" },
  { symbol: "035420", name: "NAVER", price: 185000, change: -1.2, emoji: "🔍" },
  { symbol: "035720", name: "카카오", price: 52300, change: 4.1, emoji: "💬" },
  { symbol: "000660", name: "SK하이닉스", price: 128000, change: 1.8, emoji: "💾" },
  { symbol: "051910", name: "LG화학", price: 425000, change: -0.5, emoji: "🧪" },
  { symbol: "006400", name: "삼성SDI", price: 387000, change: 3.2, emoji: "🔋" },
  { symbol: "207940", name: "삼성바이오로직스", price: 789000, change: 0.9, emoji: "🧬" },
  { symbol: "068270", name: "셀트리온", price: 178500, change: -2.1, emoji: "💊" },
]

export function StockTicker() {
  const [stocks, setStocks] = useState<StockData[]>(mockStocks)

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => ({
          ...stock,
          price: stock.price + (Math.random() - 0.5) * 1000,
          change: (Math.random() - 0.5) * 6,
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-3 overflow-hidden relative shadow-lg">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg%3E%3Cdefs%3E%3Cpattern id=\"grid\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M 20 0 L 0 0 0 20\" fill=\"none\" stroke=\"white\" strokeWidth=\"0.5\" opacity=\"0.1\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100%\" height=\"100%\" fill=\"url(%23grid)\"/%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* 상단 그라데이션 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      
      {/* 티커 내용 */}
      <div className="relative flex animate-scroll whitespace-nowrap">
        {[...stocks, ...stocks].map((stock, index) => (
          <div key={`${stock.symbol}-${index}`} className="flex items-center space-x-3 mx-6 flex-shrink-0 group">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 group-hover:bg-white/20 transition-all duration-300">
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">{stock.emoji}</span>
              <span className="font-semibold text-sm">{stock.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-green-100 font-mono text-sm">₩{stock.price.toLocaleString()}</span>
              <div className="flex items-center space-x-1">
                {stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-300" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-300" />
                )}
                <span className={`text-xs font-medium ${stock.change >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {stock.change >= 0 ? "+" : ""}
                  {stock.change.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* 구분선 */}
            <div className="w-px h-4 bg-white/20"></div>
          </div>
        ))}
      </div>
      
      {/* 하단 그라데이션 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
