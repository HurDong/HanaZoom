"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Activity,
} from "lucide-react";
import type { StockPriceData } from "@/lib/api/stock";

interface StockPriceInfoProps {
  stockData: StockPriceData;
  className?: string;
}

export function StockPriceInfo({ stockData, className }: StockPriceInfoProps) {
  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  const getPriceChangeColor = (changeSign: string) => {
    switch (changeSign) {
      case "1": // 상한가
      case "2": // 상승
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case "4": // 하락
      case "5": // 하한가
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
      default: // 보합
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800";
    }
  };

  const getPriceChangeIcon = (changeSign: string) => {
    switch (changeSign) {
      case "1":
      case "2":
        return <TrendingUp className="w-5 h-5" />;
      case "4":
      case "5":
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getBadgeVariant = (changeSign: string) => {
    switch (changeSign) {
      case "1":
      case "2":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "4":
      case "5":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getChangePrefix = (changeSign: string) => {
    switch (changeSign) {
      case "1":
      case "2":
        return "+";
      case "4":
      case "5":
        return "";
      default:
        return "";
    }
  };

  return (
    <Card
      className={`h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg ${
        className ?? ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
            {stockData.isAfterMarketClose ? "종가" : "실시간 현재가"}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs">
            {stockData.isMarketOpen ? (
              <>
                <Activity className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">
                  실시간
                </span>
              </>
            ) : stockData?.isAfterMarketClose ? (
              <>
                <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-600 dark:text-orange-400">
                  {stockData?.marketStatus}
                </span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {stockData?.marketStatus}
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex flex-col h-full">
        {/* 현재가 메인 표시 */}
        <div
          className={`rounded-xl p-4 ${getPriceChangeColor(
            stockData.changeSign
          )}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-80">
              {stockData?.isAfterMarketClose ? "종가" : "현재가"}
            </span>
            <Badge className={getBadgeVariant(stockData?.changeSign)}>
              {stockData?.changeStatus}
            </Badge>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2">
              {getPriceChangeIcon(stockData?.changeSign)}
              <span className="text-3xl font-bold">
                {formatNumber(stockData?.currentPrice)}원
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-semibold">
              {getChangePrefix(stockData?.changeSign)}
              {formatNumber(stockData?.changePrice)}원
            </span>
            <span className="text-lg font-semibold">
              ({getChangePrefix(stockData?.changeSign)}
              {stockData?.changeRate}%)
            </span>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              시가
            </span>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatNumber(stockData?.openPrice)}원
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              전일종가
            </span>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatNumber(stockData?.previousClose)}원
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm text-red-600 dark:text-red-400">고가</span>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatNumber(stockData?.highPrice)}원
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              저가
            </span>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatNumber(stockData?.lowPrice)}원
            </p>
          </div>
        </div>

        {/* 거래량 & 시총 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                거래량
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatNumber(stockData.volume)}주
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                시가총액
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatNumber(stockData.marketCap)}억
              </span>
            </div>
          </div>
        </div>

        {/* 업데이트 시간 */}
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
          <Clock className="w-3 h-3" />
          <span>자동 업데이트 (5초마다)</span>
        </div>
      </CardContent>
    </Card>
  );
}
