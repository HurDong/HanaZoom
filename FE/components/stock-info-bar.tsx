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
    <div className="sticky top-16 z-50" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)' }}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 종목 정보 */}
          <div className="flex items-center space-x-3">
            {stock.logoUrl && (
              <img 
                src={stock.logoUrl} 
                alt={stock.name}
                className="w-8 h-8 rounded-full object-cover shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-logo.svg";
                }}
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-white font-['Pretendard']">
                {stock.name}
              </h1>
              <p className="text-sm font-['Pretendard']" style={{ color: '#EFF6FF' }}>
                {stock.symbol}
              </p>
            </div>
          </div>

          {/* 주가 정보 */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-lg font-bold text-white font-['Pretendard']">
                {currentPrice.toLocaleString()}원
              </p>
              <div className="flex items-center space-x-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-red-400" />
                ) : (
                  <TrendingDown className="w-4 h-4" style={{ color: '#3B82F6' }} />
                )}
                <span className={`text-sm font-medium font-['Pretendard'] ${
                  isPositive 
                    ? "text-red-400" 
                    : ""
                }`} style={!isPositive ? { color: '#3B82F6' } : {}}>
                  {isPositive ? "+" : ""}{changeRate.toFixed(2)}%
                </span>
                <span className={`text-sm font-['Pretendard'] ${
                  isPositive 
                    ? "text-red-400" 
                    : ""
                }`} style={!isPositive ? { color: '#3B82F6' } : {}}>
                  ({isPositive ? "+" : ""}{changePrice.toLocaleString()})
                </span>
              </div>
            </div>

            {/* 실시간 상태 */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                wsConnected ? "animate-pulse" : "bg-gray-400"
              }`} style={wsConnected ? { backgroundColor: '#F59E0B' } : {}} />
              <span className="text-xs font-['Pretendard']" style={{ color: '#EFF6FF' }}>
                {wsConnected ? "실시간" : "지연"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
