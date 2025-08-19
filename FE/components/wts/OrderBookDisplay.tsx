"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { OrderBookData } from "@/lib/api/stock";

interface OrderBookDisplayProps {
  orderBookData: OrderBookData;
}

export function OrderBookDisplay({ orderBookData }: OrderBookDisplayProps) {
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

  const getQuantityBarWidth = (quantity: string, maxQuantity: number) => {
    const num = parseInt(quantity);
    return Math.min((num / maxQuantity) * 100, 100);
  };

  // 최대 거래량 계산 (호가창 전체)
  const allQuantities = [
    ...orderBookData.askOrders.map((order) => parseInt(order.quantity)),
    ...orderBookData.bidOrders.map((order) => parseInt(order.quantity)),
  ];
  const maxQuantity = Math.max(...allQuantities);

  const getImbalanceColor = () => {
    if (orderBookData.buyDominant) {
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
    } else if (orderBookData.sellDominant) {
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
    }
    return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800";
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
            호가창
          </CardTitle>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            10단계
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 호가 불균형 정보 */}
        <div className={`rounded-lg p-3 ${getImbalanceColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span className="text-sm font-medium">호가 불균형</span>
            </div>
            <span className="text-xs">
              매수 {(orderBookData.imbalanceRatio * 100).toFixed(1)}%
            </span>
          </div>
          <Progress
            value={orderBookData.imbalanceRatio * 100}
            className="h-2"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>매도: {formatNumber(orderBookData.totalAskQuantity)}주</span>
            <span>매수: {formatNumber(orderBookData.totalBidQuantity)}주</span>
          </div>
        </div>

        {/* 호가창 테이블 */}
        <div className="space-y-1">
          {/* 헤더 */}
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium border-b pb-2">
            <span className="text-center">매도잔량</span>
            <span className="text-center">호가</span>
            <span className="text-center">매수잔량</span>
          </div>

          {/* 매도 호가 (역순으로 표시 - 높은 가격부터) */}
          {[...orderBookData.askOrders].reverse().map((ask, index) => {
            const bid = orderBookData.bidOrders[9 - index]; // 대응하는 매수 호가

            return (
              <div
                key={`order-${ask.rank}`}
                className="grid grid-cols-3 gap-2 text-xs items-center py-1"
              >
                {/* 매도잔량 */}
                <div className="text-right">
                  <div className="relative">
                    <div
                      className="absolute right-0 top-0 h-full bg-blue-100 dark:bg-blue-900/30 rounded-sm opacity-60"
                      style={{
                        width: `${getQuantityBarWidth(
                          ask.quantity,
                          maxQuantity
                        )}%`,
                      }}
                    />
                    <span className="relative z-10 text-blue-600 dark:text-blue-400 font-mono text-xs px-1">
                      {formatQuantity(ask.quantity)}
                    </span>
                  </div>
                </div>

                {/* 호가 */}
                <div className="text-center">
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
                    {formatNumber(ask.price)}
                  </span>
                </div>

                {/* 매수잔량 */}
                <div className="text-left">
                  {bid && (
                    <div className="relative">
                      <div
                        className="absolute left-0 top-0 h-full bg-red-100 dark:bg-red-900/30 rounded-sm opacity-60"
                        style={{
                          width: `${getQuantityBarWidth(
                            bid.quantity,
                            maxQuantity
                          )}%`,
                        }}
                      />
                      <span className="relative z-10 text-red-600 dark:text-red-400 font-mono text-xs px-1">
                        {formatQuantity(bid.quantity)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 스프레드 정보 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                스프레드
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatNumber(orderBookData.spread)}원
              </span>
              <Badge variant="outline" className="text-xs">
                {orderBookData.buyDominant
                  ? "매수우세"
                  : orderBookData.sellDominant
                  ? "매도우세"
                  : "균형"}
              </Badge>
            </div>
          </div>
        </div>

        {/* 최우선 호가 정보 */}
        {orderBookData.askOrders.length > 0 &&
          orderBookData.bidOrders.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    최우선매수
                  </span>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(orderBookData.bidOrders[0]?.price)}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(orderBookData.bidOrders[0]?.quantity)}주
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
                  {formatNumber(orderBookData.askOrders[0]?.price)}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(orderBookData.askOrders[0]?.quantity)}주
                </p>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
