"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { api, API_ENDPOINTS, ApiResponse } from "@/app/config/api";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<ApiResponse<StockTicker[]>>(
          API_ENDPOINTS.stockTicker
        );
        // data.data가 undefined일 경우 빈 배열로 처리
        setStocks(data?.data || []);
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
        setStocks([]); // 에러 발생 시 빈 배열로 초기화
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("ko-KR").format(Number(price));
  };

  const getChangeNumber = (change: string): number => {
    return parseFloat(change.replace("%", ""));
  };

  // 로딩 중이거나 마운트되지 않았을 때 스켈레톤 UI 표시
  if (!isMounted || isLoading) {
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

  // 데이터가 없을 때 표시할 UI
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
