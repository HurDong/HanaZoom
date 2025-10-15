"use client";

import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { Stock } from "@/lib/api/stock";
import type { StockPriceData } from "@/lib/api/stock";
import { getBrandColorByStock } from "@/utils/color-utils";

interface StockInfoBarProps {
  stock: Stock | null;
  realtimeData: StockPriceData | null;
  wsConnected: boolean;
}

export function StockInfoBar({
  stock,
  realtimeData,
  wsConnected,
}: StockInfoBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!stock) return null;

  const currentPrice = realtimeData?.currentPrice
    ? parseInt(realtimeData.currentPrice)
    : stock.currentPrice || 0;

  const changePrice = realtimeData?.changePrice
    ? parseInt(realtimeData.changePrice)
    : stock.priceChange || 0;

  const changeRate = realtimeData?.changeRate
    ? parseFloat(realtimeData.changeRate)
    : stock.priceChangePercent
    ? stock.priceChangePercent
    : 0;

  const isPositive = changeRate >= 0;
  const brandColor = getBrandColorByStock(stock.symbol, stock.name);

  return (
    <>
      {/* 메인 헤더 */}
      <div
        className={`stock-header sticky top-16 z-50 ${
          isScrolled ? "scrolled shadow-sm" : "shadow-none"
        }`}
        style={{ background: brandColor.gradient }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 종목 정보 */}
            <div className="flex items-center space-x-3">
              {/* 로고 컨테이너 */}
              <div className="relative">
                {stock.logoUrl ? (
                  <img
                    src={stock.logoUrl}
                    alt={stock.name}
                    className={`object-cover rounded-lg shadow-sm transition-all duration-300 ${
                      isScrolled ? "w-8 h-8" : "w-10 h-10"
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-logo.svg";
                    }}
                  />
                ) : (
                  <div
                    className={`rounded-lg flex items-center justify-center text-white font-bold transition-all duration-300 ${
                      isScrolled ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
                    }`}
                    style={{ background: brandColor.gradient }}
                  >
                    {stock.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* 종목 정보 텍스트 */}
              <div>
                <h1
                  className={`font-bold text-white font-['Pretendard'] transition-all duration-300 ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  {stock.name}
                </h1>
                <p className="text-sm text-white/80 font-['Pretendard']">
                  {stock.symbol}
                </p>
              </div>
            </div>

            {/* 주가 정보 */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div
                  className={`font-bold text-white font-['Pretendard'] transition-all duration-300 ${
                    isScrolled ? "text-lg" : "text-xl"
                  }`}
                >
                  {currentPrice.toLocaleString()}원
                </div>
                <div className="flex items-center space-x-2">
                  {/* 등락 아이콘 */}
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-green-300" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-300" />
                    )}
                    <span
                      className={`text-sm font-medium font-['Pretendard'] ${
                        isPositive ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {changeRate.toFixed(2)}%
                    </span>
                  </div>
                  <span
                    className={`text-sm font-['Pretendard'] ${
                      isPositive ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    ({isPositive ? "+" : ""}
                    {changePrice.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* 실시간 상태 */}
              <div className="flex items-center space-x-2">
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-300" />
                )}
                <span className="text-xs text-white/80 font-['Pretendard']">
                  {wsConnected ? "실시간" : "지연"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider 라인 */}
      <div className="divider" />
    </>
  );
}
