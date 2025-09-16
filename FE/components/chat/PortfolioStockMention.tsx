"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { getPortfolioStocks, type PortfolioStock } from "@/lib/api/portfolio";

interface PortfolioStockMentionProps {
  query: string;
  onSelect: (stock: PortfolioStock) => void;
  onClose: () => void;
}

export default function PortfolioStockMention({
  query,
  onSelect,
  onClose,
}: PortfolioStockMentionProps) {
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStocks = async () => {
      if (!query.trim()) {
        setStocks([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const portfolioStocks = await getPortfolioStocks();
        
        // 쿼리로 필터링 (종목명 또는 종목코드로 검색)
        const filteredStocks = portfolioStocks.filter(
          (stock) =>
            stock.stockName.toLowerCase().includes(query.toLowerCase()) ||
            stock.stockSymbol.includes(query)
        );
        
        setStocks(filteredStocks);
      } catch (err) {
        console.error("보유종목 조회 실패:", err);
        setError("보유종목을 불러올 수 없습니다.");
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [query]);

  if (!query.trim()) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 z-50 max-h-60 overflow-y-auto shadow-lg border">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            보유종목 검색
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {loading && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            로딩 중...
          </div>
        )}
        
        {error && (
          <div className="text-center py-4 text-sm text-red-500">
            {error}
          </div>
        )}
        
        {!loading && !error && stocks.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            보유종목을 찾을 수 없습니다.
          </div>
        )}
        
        {!loading && !error && stocks.length > 0 && (
          <div className="space-y-1">
            {stocks.slice(0, 10).map((stock) => (
              <button
                key={stock.id}
                onClick={() => onSelect(stock)}
                className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm truncate">
                        {stock.stockName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stock.stockSymbol}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {stock.quantity}주
                      </span>
                      <span className="text-xs text-muted-foreground">
                        평단가: {stock.avgPurchasePrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {stock.isProfitable ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stock.isProfitable ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {stock.profitLossRate > 0 ? "+" : ""}
                      {stock.profitLossRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
