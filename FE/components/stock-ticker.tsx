"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockTicker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  emoji: string;
}

interface RedisStockData {
  stockId: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

// Redis 데이터 파싱 함수 (인덱스 수정 및 안정성 강화)
const parseRedisStockData = (
  key: string,
  redisValue: string
): (RedisStockData & { symbol: string }) | null => {
  try {
    const symbol = key.split(":")[2];
    if (!symbol || symbol.length !== 6) {
      console.warn(
        `[파싱 실패] 유효하지 않은 키에서 종목코드를 추출할 수 없습니다: ${key}`
      );
      return null;
    }

    const messageParts = redisValue.split("|");
    const dataString = messageParts[messageParts.length - 1];
    const dataParts = dataString.split("^");

    // KIS 실시간 주식 현재가(H0STCNT0)는 최소 6개의 필드를 가짐
    if (dataParts.length < 6) {
      console.warn(
        `[파싱 실패] ${symbol}: 데이터 형식이 올바르지 않습니다 (dataParts < 6).`
      );
      console.warn(`→ 수신된 전체 값: ${redisValue}`);
      return null;
    }

    // 올바른 인덱스로 데이터 추출
    const currentPrice = parseFloat(dataParts[2]); // [2]: 주식 현재가
    const changeAmount = parseFloat(dataParts[4]); // [4]: 전일 대비
    const changePercent = parseFloat(dataParts[5]); // [5]: 전일 대비율
    const volume = dataParts.length > 10 ? parseFloat(dataParts[10]) : 0; // [10]: 누적 거래량

    if (isNaN(currentPrice) || isNaN(changeAmount) || isNaN(changePercent)) {
      console.warn(
        `[파싱 실패] ${symbol}: 데이터에서 숫자를 변환할 수 없습니다.`
      );
      console.warn(`→ 수신된 데이터 값: ${dataString}`);
      return null;
    }

    console.log(`[파싱 성공] ${symbol}`, { currentPrice, changePercent });
    return {
      symbol,
      stockId: messageParts.length > 2 ? messageParts[2] : "N/A",
      currentPrice,
      changeAmount,
      changePercent,
      volume,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[파싱 오류] ${key}:`, error);
    return null;
  }
};

// 종목별 이모지 매핑
const getStockEmoji = (symbol: string): string => {
  const emojiMap: { [key: string]: string } = {
    "005930": "📱", // 삼성전자
    "000660": "🚗", // SK하이닉스
    "035420": "🌐", // NAVER
    "051910": "🔋", // LG화학
    "006400": "🏠", // 삼성SDI
    "035720": "🎮", // 카카오
    "207940": "🏦", // 삼성바이오로직스
    "068270": "🏥", // 셀트리온
    "323410": "🚀", // 카카오뱅크
    "051900": "🍺", // LG생활건강
    "034020": "🏭", // 두산에너빌리티
  };
  return emojiMap[symbol] || "📈";
};

// 종목명 매핑
const getStockName = (symbol: string): string => {
  const nameMap: { [key: string]: string } = {
    "005930": "삼성전자",
    "000660": "SK하이닉스",
    "035420": "NAVER",
    "051910": "LG화학",
    "006400": "삼성SDI",
    "035720": "카카오",
    "207940": "삼성바이오로직스",
    "068270": "셀트리온",
    "323410": "카카오뱅크",
    "051900": "LG생활건강",
    "034020": "두산에너빌리티",
  };
  return nameMap[symbol] || symbol;
};

export function StockTicker() {
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRedisStockData = useCallback(async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/redis/stocks");
      if (!response.ok) throw new Error("API 응답 실패");

      const data = await response.json();
      if (!data.stocks || !Array.isArray(data.stocks)) {
        console.warn("API에서 유효한 주식 데이터를 받지 못했습니다.", data);
        setIsUpdating(false);
        return;
      }

      const newStocks = data.stocks
        .map((stockInfo: { key: string; value: string }) => {
          const parsedData = parseRedisStockData(
            stockInfo.key,
            stockInfo.value
          );
          if (!parsedData) return null;

          return {
            id: `${parsedData.symbol}-${parsedData.timestamp}`, // 고유 ID 추가
            symbol: parsedData.symbol,
            name: getStockName(parsedData.symbol),
            price: parsedData.currentPrice.toString(),
            change: `${
              parsedData.changePercent > 0 ? "+" : ""
            }${parsedData.changePercent.toFixed(2)}%`,
            emoji: getStockEmoji(parsedData.symbol),
          };
        })
        .filter(
          (stock: StockTicker | null): stock is StockTicker => stock !== null
        );

      setStocks((prevStocks) => {
        // symbol을 기준으로 중복을 제거하고 최신 데이터로 업데이트
        const stockMap = new Map<string, StockTicker>();
        [...prevStocks, ...newStocks].forEach((stock) => {
          stockMap.set(stock.symbol, stock);
        });
        return Array.from(stockMap.values());
      });
    } catch (error) {
      console.error("[API 오류] Redis 데이터 가져오기 실패:", error);
    } finally {
      setTimeout(() => setIsUpdating(false), 500); // 애니메이션 시간을 고려하여 지연
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);

    // 초기 데이터 로드
    fetchRedisStockData();

    // 5초마다 데이터 업데이트
    const interval = setInterval(fetchRedisStockData, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchRedisStockData]);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("ko-KR").format(Number(price));
  };

  const getChangeNumber = (change: string): number => {
    return parseFloat(change.replace("%", ""));
  };

  const renderStockItem = (stock: StockTicker) => (
    <div
      key={stock.id} // key를 고유 ID로 변경
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
          <span>실시간 주식 데이터를 연결 중입니다...</span>
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
        className={`relative w-[200%] flex transition-opacity duration-500 ${
          isUpdating ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-1/2 flex whitespace-nowrap animate-[marquee_60s_linear_infinite]">
          {stocks.map((stock) => renderStockItem(stock))}
        </div>
        <div
          className="w-1/2 flex whitespace-nowrap animate-[marquee_60s_linear_infinite]"
          style={{ animationDelay: "30s" }}
        >
          {stocks.map((stock) => renderStockItem(stock))}
        </div>
      </div>
    </div>
  );
}
