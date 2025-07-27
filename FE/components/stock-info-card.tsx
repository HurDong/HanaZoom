"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, BarChart2 } from "lucide-react";
import type { Stock } from "@/lib/api/stock";

interface StockInfoCardProps {
  stock: Stock | null;
  className?: string;
}

export function StockInfoCard({ stock, className = "" }: StockInfoCardProps) {
  if (!stock) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="p-6">
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priceChange = stock.priceChange || 0;
  const priceChangePercent = stock.priceChangePercent || 0;

  return (
    <Card
      className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{stock.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stock.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{stock.symbol}</p>
            </div>
          </div>
          <div
            className={`flex items-center px-4 py-2 rounded-full ${
              priceChange >= 0
                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
            }`}
          >
            {priceChange >= 0 ? (
              <TrendingUp className="w-5 h-5 mr-2" />
            ) : (
              <TrendingDown className="w-5 h-5 mr-2" />
            )}
            <span className="font-bold text-lg">
              {priceChange >= 0 ? "+" : ""}
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>현재가</span>
            </div>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              ₩{(stock.currentPrice || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <Users className="w-4 h-4" />
              <span>거래량</span>
            </div>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {(stock.volume || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <BarChart2 className="w-4 h-4" />
              <span>시가총액</span>
            </div>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              ₩{((stock.marketCap || 0) / 1_000_000_000).toFixed(0)}B
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
