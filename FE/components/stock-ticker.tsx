"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import type { StockPriceData } from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

interface StockTicker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changeRate: string;
  logoUrl?: string;
  emoji?: string;
}

// 티커에 표시할 주요 종목들과 이모지
const TICKER_STOCKS = [
  { code: "005930", name: "삼성전자", emoji: "📱" },
  { code: "000660", name: "SK하이닉스", emoji: "💻" },
  { code: "035420", name: "NAVER", emoji: "🔍" },
  { code: "035720", name: "카카오", emoji: "💬" },
  { code: "005380", name: "현대자동차", emoji: "🚗" },
  { code: "051910", name: "LG화학", emoji: "🧪" },
  { code: "207940", name: "삼성바이오", emoji: "🧬" },
  { code: "068270", name: "셀트리온", emoji: "💊" },
  { code: "323410", name: "카카오뱅크", emoji: "🏦" },
  { code: "373220", name: "LG에너지", emoji: "🔋" },
];

export function StockTicker() {
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 웹소켓으로 실시간 주식 데이터 수신
  const {
    connected: wsConnected,
    stockData: wsStockData,
    lastUpdate,
    getStockDataMap,
  } = useStockWebSocket({
    stockCodes: TICKER_STOCKS.map((stock) => stock.code),
    onStockUpdate: (data) => {
      // 애니메이션 중단 방지를 위해 디바운싱 적용
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      updateTimeoutRef.current = setTimeout(() => {
        updateStockDisplay();
        updateTimeoutRef.current = null;
      }, 100); // 100ms 디바운싱
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  // 깜빡임 없는 부드러운 업데이트
  const updateStockDisplay = useCallback((): void => {
    // getStockDataMap은 훅에서 안정적으로 반환되지만, 의존성으로 넣으면
    // 구현 변경 시 매 렌더마다 바뀌어 효과가 반복될 수 있어 내부에서 호출만 함
    const stockDataMap = getStockDataMap();

    if (stockDataMap.size === 0) {
      return;
    }

    // 즉시 업데이트, 깜빡임 없음
    const newStocks: StockTicker[] = TICKER_STOCKS.map((tickerStock) => {
      const stockData = stockDataMap.get(tickerStock.code);
      if (!stockData) {
        // 데이터가 없으면 기본값 반환
        return {
          symbol: tickerStock.code,
          name: tickerStock.name,
          price: "0",
          change: "0.00%",
          changeRate: "0",
          emoji: tickerStock.emoji,
        };
      }

      // 등락률 앞에 + 또는 - 기호 추가
      const changePrefix =
        stockData.changeSign === "2" || stockData.changeSign === "1" ? "+" : "";
      const change =
        stockData.changePrice === "0"
          ? "0.00%"
          : `${changePrefix}${stockData.changeRate}%`;

      return {
        symbol: tickerStock.code,
        name: tickerStock.name,
        price: stockData.currentPrice,
        change: change,
        changeRate: stockData.changeRate,
        emoji: tickerStock.emoji,
      };
    });

    setStocks((prev) => {
      // 동일 데이터로 인한 불필요한 렌더를 한 번 더 방지
      const sameLength = prev.length === newStocks.length;
      const sameAll =
        sameLength &&
        prev.every(
          (p, i) =>
            p.symbol === newStocks[i].symbol &&
            p.price === newStocks[i].price &&
            p.change === newStocks[i].change
        );
      return sameAll ? prev : newStocks;
    });
  }, []);

  // 컴포넌트 마운트 및 데이터 변경 시 업데이트
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (wsConnected) {
      const map = getStockDataMap();
      if (map.size > 0) {
        updateStockDisplay();
      }
    }
    // 의존성으로 함수 레퍼런스를 두지 않고, 신호성 값들만 둔다
  }, [wsConnected, lastUpdate]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
          {getChangeNumber(stock.change) > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-300" />
          ) : getChangeNumber(stock.change) < 0 ? (
            <TrendingDown className="w-3 h-3 text-red-300" />
          ) : (
            <div className="w-3 h-3" />
          )}
          <span
            className={`text-xs font-medium transition-colors duration-200 ${
              getChangeNumber(stock.change) > 0
                ? "text-green-300"
                : getChangeNumber(stock.change) < 0
                ? "text-red-300"
                : "text-gray-300"
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

  if (!wsConnected) {
    return (
      <div className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 dark:from-red-700 dark:via-red-600 dark:to-red-700 text-white py-3 overflow-hidden relative shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>연결이 끊어졌습니다. 재연결 중...</span>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 dark:from-yellow-700 dark:via-yellow-600 dark:to-yellow-700 text-white py-3 overflow-hidden relative shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span>주식 데이터 로딩 중...</span>
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

      {/* 연결 상태 표시 */}
      <div className="absolute top-1 right-2 flex items-center gap-1 text-xs opacity-80">
        <Wifi className="w-3 h-3 animate-pulse" />
        <span>장 열림</span>
      </div>

      {/* 스크롤링 티커 - 애니메이션 중단 방지 */}
      <div className="relative w-[200%] flex">
        <div
          ref={animationRef}
          className="w-1/2 flex whitespace-nowrap animate-[marquee_120s_linear_infinite] marquee-optimized"
        >
          {stocks.map((stock, index) => renderStockItem(stock, index))}
        </div>
        <div
          className="w-1/2 flex whitespace-nowrap animate-[marquee_120s_linear_infinite] marquee-optimized"
          style={{ animationDelay: "60s" }}
        >
          {stocks.map((stock, index) => renderStockItem(stock, index))}
        </div>
      </div>
    </div>
  );
}
