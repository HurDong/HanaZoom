"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { type PortfolioStock } from "@/lib/api/portfolio";

interface PortfolioStockCardProps {
  stock: PortfolioStock;
}

export default function PortfolioStockCard({ stock }: PortfolioStockCardProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const formatCurrency = (num: number) => {
    return `${num > 0 ? "+" : ""}${formatNumber(num)}원`;
  };

  const isProfit = stock.profitLoss >= 0;

  return (
    <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">{stock.stockName}</span>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
              {stock.stockSymbol}
            </Badge>
          </div>
          <div
            className={`flex items-center text-sm font-bold ${
              isProfit ? "text-red-400" : "text-blue-400"
            }`}
          >
            {isProfit ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {formatPercentage(stock.profitLossRate)}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">보유수량:</span>
            <span className="text-white font-medium">{formatNumber(stock.quantity)}주</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">평단가:</span>
            <span className="text-white font-medium">{formatNumber(stock.avgPurchasePrice)}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">현재가:</span>
            <span className="text-white font-medium">{formatNumber(stock.currentPrice)}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">수익금:</span>
            <span
              className={`font-bold ${
                isProfit ? "text-red-400" : "text-blue-400"
              }`}
            >
              {formatCurrency(stock.profitLoss)}
            </span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            {new Date(stock.firstPurchaseDate).toLocaleDateString()} 첫 매수
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
