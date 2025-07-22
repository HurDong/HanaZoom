"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// API 응답 데이터 타입 정의
interface StockTicker {
  symbol: string;
  name: string;
  price: string;
  change: string; // 예: "+1.50%" 또는 "-2.34%"
  emoji: string;
}

export function StockTicker() {
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchStockData = async () => {
      try {
        const response = await fetch("/api/v1/stocks/ticker");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: StockTicker[] = await response.json();
        setStocks(data);
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 5000); // 5초마다 데이터 업데이트

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("ko-KR").format(Number(price));
  };

  const getChangeNumber = (change: string): number => {
    return parseFloat(change.replace("%", ""));
  };

  // 데이터가 로드되기 전에는 렌더링하지 않거나 로딩 상태를 보여줌
  if (!isMounted || stocks.length === 0) {
    return null; // 또는 로딩 스켈레톤
  }

  return (
    <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-3 overflow-hidden relative shadow-lg">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
          }}
        ></div>
      </div>

      {/* 티커 내용 */}
      <div className="relative flex whitespace-nowrap hover:[animation-play-state:paused]">
        <div className="animate-marquee flex">
          {stocks.map((stock, index) => {
            const changeValue = getChangeNumber(stock.change);
            return (
              <div
                key={`${stock.symbol}-${index}`}
                className="flex items-center space-x-3 mx-6 flex-shrink-0"
              >
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/20 transition-all duration-300">
                  <span className="text-lg hover:scale-110 transition-transform duration-300">
                    {stock.emoji}
                  </span>
                  <span className="font-semibold text-sm">{stock.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-green-100 font-mono text-sm">
                    ₩{formatPrice(stock.price)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {changeValue >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-300" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-300" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        changeValue >= 0 ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {stock.change}
                    </span>
                  </div>
                </div>
                {/* 구분선 */}
                <div className="w-px h-4 bg-white/20"></div>
              </div>
            );
          })}
        </div>
        <div className="animate-marquee flex" aria-hidden="true">
          {stocks.map((stock, index) => {
            const changeValue = getChangeNumber(stock.change);
            return (
              <div
                key={`${stock.symbol}-${index}-duplicate`}
                className="flex items-center space-x-3 mx-6 flex-shrink-0"
              >
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/20 transition-all duration-300">
                  <span className="text-lg hover:scale-110 transition-transform duration-300">
                    {stock.emoji}
                  </span>
                  <span className="font-semibold text-sm">{stock.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-green-100 font-mono text-sm">
                    ₩{formatPrice(stock.price)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {changeValue >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-300" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-300" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        changeValue >= 0 ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {stock.change}
                    </span>
                  </div>
                </div>
                {/* 구분선 */}
                <div className="w-px h-4 bg-white/20"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StockTicker;
