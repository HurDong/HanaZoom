"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { Stock } from "@/lib/api/stock";
import type { StockPriceData } from "@/lib/api/stock";

interface StockInfoBarProps {
  stock: Stock | null;
  realtimeData: StockPriceData | null;
  wsConnected: boolean;
}

export function StockInfoBar({ stock, realtimeData, wsConnected }: StockInfoBarProps) {
  if (!stock) return null;

  const currentPrice = realtimeData?.currentPrice 
    ? parseInt(realtimeData.currentPrice) 
    : stock.currentPrice || 0;
  
  const changePrice = realtimeData?.changePrice 
    ? parseInt(realtimeData.changePrice) 
    : stock.priceChange || 0;
  
  const changeRate = realtimeData?.changeRate 
    ? parseFloat(realtimeData.changeRate) / 100 
    : stock.priceChangePercent ? stock.priceChangePercent / 100 : 0;

  const isPositive = changeRate >= 0;

  return (
    <div className="sticky top-16 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 종목 정보 */}
          <div className="flex items-center space-x-3">
            {stock.logoUrl && (
              <img 
                src={stock.logoUrl} 
                alt={stock.name}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-logo.svg";
                }}
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {stock.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stock.symbol}
              </p>
            </div>
          </div>

          {/* 주가 정보 */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentPrice.toLocaleString()}원
              </p>
              <div className="flex items-center space-x-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-blue-500" />
                )}
                <span className={`text-sm font-medium ${
                  isPositive 
                    ? "text-red-500 dark:text-red-400" 
                    : "text-blue-500 dark:text-blue-400"
                }`}>
                  {isPositive ? "+" : ""}{changeRate.toFixed(2)}%
                </span>
                <span className={`text-sm ${
                  isPositive 
                    ? "text-red-500 dark:text-red-400" 
                    : "text-blue-500 dark:text-blue-400"
                }`}>
                  ({isPositive ? "+" : ""}{changePrice.toLocaleString()})
                </span>
              </div>
            </div>

            {/* 실시간 상태 */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {wsConnected ? "실시간" : "지연"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
