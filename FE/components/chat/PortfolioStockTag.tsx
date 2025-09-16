"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { type PortfolioStock } from "@/lib/api/portfolio";

interface PortfolioStockTagProps {
  stock: PortfolioStock;
  onRemove?: () => void;
  isClickable?: boolean;
}

export default function PortfolioStockTag({
  stock,
  onRemove,
  isClickable = true,
}: PortfolioStockTagProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const formatCurrency = (num: number) => {
    return `${num > 0 ? "+" : ""}${formatNumber(num)}원`;
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => isClickable && setShowDetails(!showDetails)}
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          stock.isProfitable
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
        } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
      >
        <span>#{stock.stockName}</span>
        {stock.isProfitable ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span className="font-bold">
          {formatPercentage(stock.profitLossRate)}
        </span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>

      {showDetails && isClickable && (
        <Card className="absolute top-full left-0 z-50 w-80 shadow-lg border mt-1">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{stock.stockName}</h3>
                  <Badge variant="outline" className="text-xs">
                    {stock.stockSymbol}
                  </Badge>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">보유 수량</span>
                  <div className="font-medium">{formatNumber(stock.quantity)}주</div>
                </div>
                <div>
                  <span className="text-muted-foreground">평단가</span>
                  <div className="font-medium">{formatNumber(stock.avgPurchasePrice)}원</div>
                </div>
                <div>
                  <span className="text-muted-foreground">현재가</span>
                  <div className="font-medium">{formatNumber(stock.currentPrice)}원</div>
                </div>
                <div>
                  <span className="text-muted-foreground">총 매수금액</span>
                  <div className="font-medium">{formatNumber(stock.totalPurchaseAmount)}원</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">수익률</span>
                  <div className="flex items-center space-x-1">
                    {stock.isProfitable ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`font-bold text-lg ${
                        stock.isProfitable ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {formatPercentage(stock.profitLossRate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">수익금액</span>
                  <span
                    className={`font-bold ${
                      stock.isProfitable ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(stock.profitLoss)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div>첫 매수: {new Date(stock.firstPurchaseDate).toLocaleDateString()}</div>
                <div>최근 매수: {new Date(stock.lastPurchaseDate).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
