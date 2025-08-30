"use client";

import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Scale,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { OrderBookData } from "@/lib/api/stock";
import type { StockPriceData } from "@/lib/api/stock";

interface OrderBookDisplayProps {
  orderBookData: OrderBookData | null;
  realtimeData?: StockPriceData | null;
  isWebSocketConnected?: boolean;
  onRefresh?: () => void;
  onPriceClick?: (price: string) => void;
  className?: string;
}

export function OrderBookDisplay({
  orderBookData,
  realtimeData,
  isWebSocketConnected = false,
  onRefresh,
  onPriceClick,
  className = "",
}: OrderBookDisplayProps) {
  const [localOrderBookData, setLocalOrderBookData] =
    useState<OrderBookData | null>(orderBookData);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // 웹소켓 실시간 데이터가 있으면 호가창 데이터 업데이트
  useEffect(() => {
    if (realtimeData && orderBookData) {
      // 웹소켓 데이터에 호가창 정보가 있으면 우선 사용
      if (realtimeData.askOrders && realtimeData.bidOrders) {
        console.log("📊 웹소켓 호가창 데이터로 실시간 업데이트");
        const wsOrderBookData: OrderBookData = {
          stockCode: realtimeData.stockCode,
          stockName: realtimeData.stockName,
          currentPrice: realtimeData.currentPrice,
          updatedTime: realtimeData.updatedTime,
          askOrders: realtimeData.askOrders,
          bidOrders: realtimeData.bidOrders,
          totalAskQuantity: realtimeData.totalAskQuantity || "0",
          totalBidQuantity: realtimeData.totalBidQuantity || "0",
          imbalanceRatio: realtimeData.imbalanceRatio || 0.5,
          spread: realtimeData.spread || 0,
          buyDominant: realtimeData.buyDominant || false,
          sellDominant: realtimeData.sellDominant || false,
        };
        setLocalOrderBookData(wsOrderBookData);
        setLastUpdate(Date.now());
        return;
      }

      // 웹소켓에 호가창 데이터가 없으면 기존 로직 사용
      const updatedOrderBook = { ...orderBookData };

      // 최우선 매수/매도 호가 업데이트 (실시간 데이터가 있는 경우)
      if (realtimeData.currentPrice) {
        const currentPrice = parseInt(realtimeData.currentPrice);

        // 최우선 매수호가 (현재가보다 낮은 가격)
        if (updatedOrderBook.bidOrders.length > 0) {
          const bestBid = updatedOrderBook.bidOrders[0];
          if (bestBid && parseInt(bestBid.price) < currentPrice) {
            // 실시간 가격 변동에 따른 호가 조정
            updatedOrderBook.bidOrders[0] = {
              ...bestBid,
              price: (currentPrice - 1).toString(),
              quantity: realtimeData.volume || bestBid.quantity,
            };
          }
        }

        // 최우선 매도호가 (현재가보다 높은 가격)
        if (updatedOrderBook.askOrders.length > 0) {
          const bestAsk = updatedOrderBook.askOrders[0];
          if (bestAsk && parseInt(bestAsk.price) > currentPrice) {
            updatedOrderBook.askOrders[0] = {
              ...bestAsk,
              price: (currentPrice + 1).toString(),
              quantity: realtimeData.volume || bestAsk.quantity,
            };
          }
        }

        // 스프레드 재계산
        if (
          updatedOrderBook.askOrders.length > 0 &&
          updatedOrderBook.bidOrders.length > 0
        ) {
          const bestAskPrice = parseInt(updatedOrderBook.askOrders[0].price);
          const bestBidPrice = parseInt(updatedOrderBook.bidOrders[0].price);
          updatedOrderBook.spread = bestAskPrice - bestBidPrice;
        }
      }

      setLocalOrderBookData(updatedOrderBook);
      setLastUpdate(Date.now());
    }
  }, [realtimeData, orderBookData]);

  // HTTP API 데이터가 업데이트되면 로컬 데이터도 업데이트
  useEffect(() => {
    if (orderBookData) {
      setLocalOrderBookData(orderBookData);
      setLastUpdate(Date.now());
    }
  }, [orderBookData]);

  // 데이터가 없으면 로딩 상태 표시
  if (!localOrderBookData) {
    return (
      <Card
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg ${className}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              호가창
            </CardTitle>
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-600"
            >
              데이터 로딩 중...
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              호가창 데이터를 불러오는 중...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: string | number) => {
    return parseInt(num.toString()).toLocaleString();
  };

  const formatQuantity = (quantity: string) => {
    const num = parseInt(quantity);
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  };

  const getImbalanceColor = () => {
    if (localOrderBookData.buyDominant) {
      return "text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30";
    } else if (localOrderBookData.sellDominant) {
      return "text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30";
    }
    return "text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50";
  };

  // 현재가 계산 (최우선매수와 최우선매도의 중간값)
  const getCurrentPrice = () => {
    if (
      localOrderBookData.askOrders.length > 0 &&
      localOrderBookData.bidOrders.length > 0
    ) {
      const bestAsk = parseInt(localOrderBookData.askOrders[0].price);
      const bestBid = parseInt(localOrderBookData.bidOrders[0].price);
      return Math.round((bestAsk + bestBid) / 2);
    }
    return 0;
  };

  // 스프레드 비율 계산 (스프레드 / 현재가 * 100)
  const getSpreadRatio = () => {
    if (
      localOrderBookData.askOrders.length > 0 &&
      localOrderBookData.bidOrders.length > 0
    ) {
      const bestAsk = parseInt(localOrderBookData.askOrders[0].price);
      const bestBid = parseInt(localOrderBookData.bidOrders[0].price);
      const spread = bestAsk - bestBid;
      const currentPrice = Math.round((bestAsk + bestBid) / 2);
      return (spread / currentPrice) * 100;
    }
    return 0;
  };

  // 수량 바 너비 계산 (최대 수량 대비)
  const getQuantityBarWidth = (quantity: string, maxQuantity: number) => {
    const num = parseInt(quantity);
    return Math.min((num / maxQuantity) * 100, 100);
  };

  // 최대 거래량 계산 (호가창 전체)
  const allQuantities = [
    ...localOrderBookData.askOrders.map((order) => parseInt(order.quantity)),
    ...localOrderBookData.bidOrders.map((order) => parseInt(order.quantity)),
  ];
  const maxQuantity = Math.max(...allQuantities);

  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    return `${Math.floor(seconds / 3600)}시간 전`;
  };

  // 실시간 업데이트 애니메이션 상태
  const [isUpdating, setIsUpdating] = useState(false);

  // 실시간 데이터 업데이트 시 애니메이션
  useEffect(() => {
    if (realtimeData && orderBookData) {
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 1000);
    }
  }, [realtimeData, orderBookData]);

  return (
    <div className={`${className} overflow-hidden`}>
      <div className="pb-4 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-green-800 dark:text-green-200">
            호가창
          </div>
          <div className="flex items-center gap-2">
            {/* 연결 상태 표시 */}
            <div className="flex items-center gap-1">
              {isWebSocketConnected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
            </div>

            {/* 데이터 소스 표시 */}
            <Badge
              className={
                isWebSocketConnected
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }
            >
              {isWebSocketConnected ? "실시간" : "HTTP API"}
            </Badge>

            {/* 수동 새로고침 버튼 */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0 text-gray-500 hover:text-green-600"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* 마지막 업데이트 시간 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>10단계 호가</span>
          <div className="flex items-center gap-2">
            <span>마지막 업데이트: {getTimeAgo()}</span>
            {/* 실시간 업데이트 애니메이션 */}
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isUpdating ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-6 pb-4">
        {/* 호가 불균형 정보 - WTS 스타일 (라이트/다크 모드 최적화) */}
        <div className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-none">
          {/* 제목 */}
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              매수/매도 불균형
            </span>
          </div>

          {/* 우세도 표시 */}
          <div className="mb-4">
            <div
              className={`text-base font-bold ${
                localOrderBookData.buyDominant
                  ? "text-blue-600 dark:text-blue-400"
                  : localOrderBookData.sellDominant
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {localOrderBookData.buyDominant
                ? "매수 우세"
                : localOrderBookData.sellDominant
                ? "매도 우세"
                : "호가 균형"}
              <span className="text-lg ml-2">
                ({(localOrderBookData.imbalanceRatio * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Progress Bar 방식의 비율 표시 */}
          <div className="space-y-3 mb-4">
            {/* 매수 비율 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-mono w-10 font-semibold">
                매수
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-mono w-12 font-bold">
                {(localOrderBookData.imbalanceRatio * 100).toFixed(0)}%
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 h-full transition-all duration-500 rounded-full shadow-sm"
                  style={{
                    width: `${localOrderBookData.imbalanceRatio * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* 매도 비율 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600 dark:text-red-400 font-mono w-10 font-semibold">
                매도
              </span>
              <span className="text-sm text-red-600 dark:text-red-400 font-mono w-12 font-bold">
                {((1 - localOrderBookData.imbalanceRatio) * 100).toFixed(0)}%
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-400 to-red-500 dark:from-red-500 dark:to-red-600 h-full transition-all duration-500 rounded-full shadow-sm"
                  style={{
                    width: `${(1 - localOrderBookData.imbalanceRatio) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* 수량 정보 - 보조 정보로 작게 */}
          <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-600 pt-3">
            <div className="flex justify-between">
              <span className="font-medium">
                매수 잔량:{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(localOrderBookData.totalBidQuantity)}주
                </span>
              </span>
              <span className="font-medium">
                매도 잔량:{" "}
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatNumber(localOrderBookData.totalAskQuantity)}주
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 호가창 테이블 */}
        <div className="space-y-0.5">
          {/* 헤더 */}
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 pb-2">
            <span className="text-center">매도잔량</span>
            <span className="text-center">호가</span>
            <span className="text-center">매수잔량</span>
          </div>

          {/* 매도 호가 (역순으로 표시 - 높은 가격부터) */}
          {[...localOrderBookData.askOrders].reverse().map((ask, index) => {
            const bid = localOrderBookData.bidOrders[9 - index]; // 대응하는 매수 호가
            const currentPrice = getCurrentPrice();
            const isCurrentPriceLevel =
              parseInt(ask.price) === currentPrice ||
              parseInt(bid?.price || "0") === currentPrice;

            return (
              <div
                key={`order-${ask.rank || index}-${ask.price}`}
                className={`grid grid-cols-3 gap-2 text-xs items-center py-1.5 rounded ${
                  isCurrentPriceLevel
                    ? "bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* 매도잔량 */}
                <div className="text-right">
                  <div className="relative">
                    <div
                      className="absolute right-0 top-0 h-full bg-red-200 dark:bg-red-800/40 rounded-sm opacity-80"
                      style={{
                        width: `${getQuantityBarWidth(
                          ask.quantity,
                          maxQuantity
                        )}%`,
                      }}
                    />
                    <span className="relative z-10 text-red-700 dark:text-red-300 font-mono text-xs">
                      {formatQuantity(ask.quantity)}
                    </span>
                  </div>
                </div>

                {/* 호가 */}
                <div className="text-center">
                  <button
                    onClick={() => onPriceClick?.(ask.price)}
                    className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    {formatNumber(ask.price)}
                  </button>
                </div>

                {/* 매수잔량 */}
                <div className="text-left">
                  {bid && (
                    <div className="relative">
                      <div
                        className="absolute left-0 top-0 h-full bg-cyan-200 dark:bg-cyan-800/40 rounded-sm opacity-80"
                        style={{
                          width: `${getQuantityBarWidth(
                            bid.quantity,
                            maxQuantity
                          )}%`,
                        }}
                      />
                      <button
                        onClick={() => onPriceClick?.(bid.price)}
                        className="relative z-10 text-cyan-700 dark:text-cyan-400 font-mono text-xs px-1 hover:bg-cyan-200 dark:hover:bg-cyan-800/50 rounded cursor-pointer transition-colors"
                      >
                        {formatQuantity(bid.quantity)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 최우선 호가 정보 */}
        {localOrderBookData.askOrders.length > 0 &&
          localOrderBookData.bidOrders.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    최우선매수
                  </span>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(localOrderBookData.bidOrders[0]?.price)}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(localOrderBookData.bidOrders[0]?.quantity)}주
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600 dark:text-red-400">
                    최우선매도
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatNumber(localOrderBookData.askOrders[0]?.price)}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(localOrderBookData.askOrders[0]?.quantity)}주
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
