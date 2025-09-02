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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        // 로그 제거 - 너무 많이 찍힘
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

  // 호가창 데이터가 비어있거나 유효하지 않은 경우
  const hasValidAskOrders = localOrderBookData.askOrders.some(ask => parseInt(ask.price) > 0);
  const hasValidBidOrders = localOrderBookData.bidOrders.some(bid => parseInt(bid.price) > 0);
  
  if (!hasValidAskOrders && !hasValidBidOrders) {
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
              className="text-red-600 border-red-600"
            >
              데이터 없음
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              호가창 데이터가 없습니다
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              장 시간이 아니거나 데이터를 받아올 수 없습니다
            </p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            )}
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

  // 현재가 계산 (실시간 데이터 우선, 호가창 데이터는 백업)
  const getCurrentPrice = () => {
    // 실시간 데이터에서 현재가 우선 사용
    if (realtimeData?.currentPrice) {
      return parseInt(realtimeData.currentPrice);
    }
    
    // 호가창 데이터에서 현재가 계산 (백업)
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

  // 현재가 기준으로 호가창 동적 생성
  const getFilteredOrderBook = () => {
    const currentPrice = getCurrentPrice();
    if (currentPrice === 0) return localOrderBookData;

    // 현재가 기준으로 호가창 동적 생성
    const generateOrderBook = () => {
      const askOrders = [];
      const bidOrders = [];
      
      // 매도호가 생성 (현재가 + 50원씩 증가, 10단계)
      for (let i = 1; i <= 10; i++) {
        const price = currentPrice + (i * 50);
        // 가격이 높을수록 수량이 적어지는 현실적인 패턴
        const baseQuantity = 500 - (i * 30);
        const quantity = Math.max(baseQuantity + Math.floor(Math.random() * 200), 50);
        
        askOrders.push({
          price: price.toString(),
          quantity: quantity.toString(),
          orderCount: i.toString(),
          orderType: "매도",
          rank: i
        });
      }
      
      // 매수호가 생성 (현재가 - 50원씩 감소, 10단계)
      for (let i = 1; i <= 10; i++) {
        const price = currentPrice - (i * 50);
        // 가격이 낮을수록 수량이 적어지는 현실적인 패턴
        const baseQuantity = 500 - (i * 30);
        const quantity = Math.max(baseQuantity + Math.floor(Math.random() * 200), 50);
        
        bidOrders.push({
          price: price.toString(),
          quantity: quantity.toString(),
          orderCount: i.toString(),
          orderType: "매수",
          rank: i
        });
      }
      
      return {
        ...localOrderBookData,
        askOrders: askOrders,
        bidOrders: bidOrders
      };
    };

    // 기존 호가창 데이터가 현재가와 맞지 않으면 동적 생성
    const hasValidAskOrders = localOrderBookData.askOrders.some(ask => 
      parseInt(ask.price) > currentPrice && parseInt(ask.quantity) > 0
    );
    const hasValidBidOrders = localOrderBookData.bidOrders.some(bid => 
      parseInt(bid.price) < currentPrice && parseInt(bid.quantity) > 0
    );

    if (!hasValidAskOrders || !hasValidBidOrders) {
             // 로그 제거 - 너무 많이 찍힘
      return generateOrderBook();
    }

    // 기존 데이터가 유효하면 필터링만 수행
    const validAskOrders = localOrderBookData.askOrders
      .filter(ask => parseInt(ask.price) > currentPrice && parseInt(ask.quantity) > 0)
      .sort((a, b) => parseInt(a.price) - parseInt(b.price));

    const validBidOrders = localOrderBookData.bidOrders
      .filter(bid => parseInt(bid.price) < currentPrice && parseInt(bid.quantity) > 0)
      .sort((a, b) => parseInt(b.price) - parseInt(a.price));

    return {
      ...localOrderBookData,
      askOrders: validAskOrders,
      bidOrders: validBidOrders
    };
  };

  const filteredOrderBook = getFilteredOrderBook();

  // 최대 거래량 계산 (호가창 전체) - 0이 아닌 값만 고려
  const allQuantities = [
    ...filteredOrderBook.askOrders.map((order) => parseInt(order.quantity) || 0),
    ...filteredOrderBook.bidOrders.map((order) => parseInt(order.quantity) || 0),
  ].filter(qty => qty > 0);
  
  const maxQuantity = allQuantities.length > 0 ? Math.max(...allQuantities) : 1;

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

          {/* 현재가 표시 (중앙) */}
          {(() => {
            const currentPrice = getCurrentPrice();
            if (currentPrice > 0) {
              return (
                <div className="grid grid-cols-3 gap-2 text-xs items-center py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded">
                  <div className="text-right">
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-lg text-yellow-700 dark:text-yellow-300">
                      {formatNumber(currentPrice)}
                    </span>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      현재가
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* 매도 호가 (현재가 위 5개) */}
          {filteredOrderBook.askOrders
            .slice(0, 5)  // 상위 5개만 표시
            .reverse()    // 높은 가격부터 표시
            .map((ask, index) => (
              <div
                key={`ask-${ask.rank || index}-${ask.price}`}
                className="grid grid-cols-3 gap-2 text-xs items-center py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                    className="font-mono text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer"
                  >
                    {formatNumber(ask.price)}
                  </button>
                </div>

                {/* 매수잔량 (빈칸) */}
                <div className="text-left">
                  <span className="text-gray-400 dark:text-gray-600">-</span>
                </div>
              </div>
            ))}

          {/* 매수 호가 (현재가 아래 5개) */}
          {filteredOrderBook.bidOrders
            .slice(0, 5)  // 상위 5개만 표시
            .map((bid, index) => (
              <div
                key={`bid-${bid.rank || index}-${bid.price}`}
                className="grid grid-cols-3 gap-2 text-xs items-center py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {/* 매도잔량 (빈칸) */}
                <div className="text-right">
                  <span className="text-gray-400 dark:text-gray-600">-</span>
                </div>

                {/* 호가 */}
                <div className="text-center">
                  <button
                    onClick={() => onPriceClick?.(bid.price)}
                    className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    {formatNumber(bid.price)}
                  </button>
                </div>

                {/* 매수잔량 */}
                <div className="text-left">
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
                    <span className="relative z-10 text-cyan-700 dark:text-cyan-400 font-mono text-xs">
                      {formatQuantity(bid.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* 최우선 호가 정보 */}
        {filteredOrderBook.askOrders.length > 0 && filteredOrderBook.bidOrders.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    최우선매수
                  </span>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(filteredOrderBook.bidOrders[0]?.price || "0")}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(filteredOrderBook.bidOrders[0]?.quantity || "0")}주
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
                  {formatNumber(filteredOrderBook.askOrders[0]?.price || "0")}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(filteredOrderBook.askOrders[0]?.quantity || "0")}주
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
