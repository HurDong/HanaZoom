"use client";

import { PortfolioSummary } from "@/types/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary;
}

export default function PortfolioSummaryCard({
  summary,
}: PortfolioSummaryCardProps) {
  const {
    totalStockCount,
    totalStockValue,
    totalProfitLoss,
    totalProfitLossRate,
  } = summary;

  // 개발자 도구에 DTO 데이터 로깅
  console.log("🔍 PortfolioSummary DTO 전체:", summary);
  console.log("💵 totalBalance 값:", summary.totalBalance);
  console.log("💵 availableCash 값:", summary.availableCash);
  console.log("💵 settlementCash 값:", summary.settlementCash);
  console.log("💵 withdrawableCash 값:", summary.withdrawableCash);
  console.log("💵 frozenCash 값:", summary.frozenCash);
  console.log("💵 totalCash 값:", summary.totalCash);

  const isProfit = (totalProfitLoss || 0) >= 0;
  const totalAssets = summary.totalBalance || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 총 자산 */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            총 자산
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {totalAssets.toLocaleString()}원
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            현금 + 주식 평가금액
          </div>
        </CardContent>
      </Card>

      {/* 평가손익 */}
      <Card
        className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${
          isProfit
            ? "border-red-200 dark:border-red-800"
            : "border-blue-200 dark:border-blue-800"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            평가손익
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isProfit
                ? "text-red-900 dark:text-red-100"
                : "text-blue-900 dark:text-blue-100"
            }`}
          >
            {(totalProfitLoss || 0).toLocaleString()}원
          </div>
          <div
            className={`text-sm mt-1 ${
              isProfit
                ? "text-red-600 dark:text-red-400"
                : "text-blue-600 dark:text-blue-400"
            }`}
          >
            {(totalProfitLossRate || 0).toFixed(2)}%
          </div>
        </CardContent>
      </Card>

      {/* 보유 주식 */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            보유 주식
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {totalStockCount || 0}종목
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            {(totalStockValue || 0).toLocaleString()}원
          </div>
        </CardContent>
      </Card>

      {/* 사용가능 현금 */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            사용가능
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {(summary.availableCash || 0).toLocaleString()}원
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            즉시 거래 가능
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
