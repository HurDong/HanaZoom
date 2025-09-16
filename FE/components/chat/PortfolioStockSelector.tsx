"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getPortfolioStocks, type PortfolioStock } from "@/lib/api/portfolio";

interface PortfolioStockSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stock: PortfolioStock) => void;
}

export default function PortfolioStockSelector({
  isOpen,
  onClose,
  onSelect,
}: PortfolioStockSelectorProps) {
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPortfolioStocks();
        setStocks(data);
        setFilteredStocks(data);
      } catch (err) {
        console.error("Failed to fetch portfolio stocks:", err);
        setError("보유종목을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStocks(stocks);
    } else {
      setFilteredStocks(
        stocks.filter(
          (stock) =>
            stock.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.stockSymbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, stocks]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>보유종목 선택</DialogTitle>
          <DialogDescription>
            채팅에 공유할 보유종목을 선택하세요.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="종목명 또는 종목코드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
        <ScrollArea className="flex-grow pr-4 -mr-4">
          {loading && <p className="text-center text-muted-foreground">불러오는 중...</p>}
          {error && <p className="text-center text-red-500">오류: {error}</p>}
          {!loading && filteredStocks.length === 0 && !error && (
            <p className="text-center text-muted-foreground">보유종목이 없습니다.</p>
          )}
          <div className="space-y-3">
            {filteredStocks.map((stock, index) => {
              const isProfit = stock.profitLoss >= 0;
              return (
                <Card
                  key={`${stock.stockSymbol}-${index}`}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelect(stock)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-base">
                          {stock.stockName}
                        </span>
                        <Badge variant="secondary">{stock.stockSymbol}</Badge>
                      </div>
                      <div
                        className={`flex items-center text-sm font-medium ${
                          isProfit ? "text-red-500" : "text-blue-500"
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
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">평단가:</span>{" "}
                        {formatNumber(stock.avgPurchasePrice)}원
                      </div>
                      <div className="text-right">
                        <span className="font-medium">보유수량:</span>{" "}
                        {formatNumber(stock.quantity)}주
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">수익금:</span>{" "}
                        <span
                          className={`font-semibold ${
                            isProfit ? "text-red-500" : "text-blue-500"
                          }`}
                        >
                          {formatCurrency(stock.profitLoss)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
