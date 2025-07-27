"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";

interface StockTicker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  emoji: string;
}

export function StockTicker() {
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchStockData = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<StockTicker[]>>(
        API_ENDPOINTS.stockTicker
      );
      const newStocks = data?.data || [];

      // 데이터가 실제로 변경되었을 때만 업데이트
      if (JSON.stringify(stocks) !== JSON.stringify(newStocks)) {
        setIsUpdating(true);
        // 페이드 아웃 후 데이터 업데이트
        setTimeout(() => {
          setStocks(newStocks);
          setIsUpdating(false);
        }, 300);
      }
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
      if (stocks.length === 0) {
        setStocks([]);
      }
    }
  }, [stocks]);

  useEffect(() => {
    setIsMounted(true);
    fetchStockData();
    const interval = setInterval(fetchStockData, 5000);
    return () => clearInterval(interval);
  }, [fetchStockData]);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("ko-KR").format(Number(price));
  };

  const getChangeNumber = (change: string): number => {
    return parseFloat(change.replace("%", ""));
  };

  const renderStockItem = (stock: StockTicker, index: number) => (
    <div
      key={`${stock.symbol}-${index}`}
      className="inline-flex items-center space-x-3 mx-6"
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
          {getChangeNumber(stock.change) >= 0 ? (
            <TrendingUp className="w-3 h-3 text-green-300" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-300" />
          )}
          <span
            className={`text-xs font-medium ${
              getChangeNumber(stock.change) >= 0
                ? "text-green-300"
                : "text-red-300"
            }`}
          >
            {stock.change}
          </span>
        </div>
      </div>
      <div className="w-px h-4 bg-white/20"></div>
    </div>
  );

  if (!isMounted) {
    return (
      <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-3 overflow-hidden relative shadow-lg animate-pulse">
        <div className="flex items-center justify-center h-12">
          <div className="h-4 bg-white/20 rounded w-32 mx-2"></div>
          <div className="h-4 bg-white/20 rounded w-24 mx-2"></div>
          <div className="h-4 bg-white/20 rounded w-16 mx-2"></div>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-3 overflow-hidden relative shadow-lg">
        <div className="flex items-center justify-center">
          <span>주식 데이터를 불러올 수 없습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-3 overflow-hidden relative shadow-lg">
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

      <div
        className={`relative w-[200%] flex transition-opacity duration-300 ${
          isUpdating ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-1/2 flex whitespace-nowrap animate-[marquee_60s_linear_infinite]">
          {stocks.map((stock, index) => renderStockItem(stock, index))}
        </div>
        <div
          className="w-1/2 flex whitespace-nowrap animate-[marquee_60s_linear_infinite]"
          style={{ animationDelay: "30s" }}
        >
          {stocks.map((stock, index) => renderStockItem(stock, index))}
        </div>
      </div>
    </div>
  );
}
