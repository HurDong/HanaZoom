"use client";

import { useState } from "react";
import { PortfolioStock } from "@/types/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";

interface PortfolioStocksTableProps {
  stocks: PortfolioStock[];
  onRefresh: () => void;
}

export default function PortfolioStocksTable({
  stocks,
  onRefresh,
}: PortfolioStocksTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "profitLoss" | "value">(
    "symbol"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.stockSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.stockName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "symbol":
        aValue = a.stockSymbol;
        bValue = b.stockSymbol;
        break;
      case "profitLoss":
        aValue = a.profitLoss;
        bValue = b.profitLoss;
        break;
      case "value":
        aValue = a.currentValue;
        bValue = b.currentValue;
        break;
      default:
        aValue = a.stockSymbol;
        bValue = b.stockSymbol;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  if (stocks.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">
            보유 주식
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-green-700 dark:text-green-300">
            <p>보유하고 있는 주식이 없습니다.</p>
            <p className="text-sm mt-2">
              거래하기 버튼을 눌러 첫 주식을 구매해보세요!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-green-900 dark:text-green-100">
          보유 주식
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 dark:text-green-400 w-4 h-4" />
            <Input
              placeholder="종목명 또는 종목코드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
            />
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-green-200 dark:border-green-800">
                <TableHead
                  className="text-green-900 dark:text-green-100 cursor-pointer"
                  onClick={() => handleSort("symbol")}
                >
                  종목 {getSortIcon("symbol")}
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  수량
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  평균단가
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  현재가
                </TableHead>
                <TableHead
                  className="text-green-900 dark:text-green-100 cursor-pointer"
                  onClick={() => handleSort("value")}
                >
                  평가금액 {getSortIcon("value")}
                </TableHead>
                <TableHead
                  className="text-green-900 dark:text-green-100 cursor-pointer"
                  onClick={() => handleSort("profitLoss")}
                >
                  평가손익 {getSortIcon("profitLoss")}
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  수익률
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStocks.map((stock) => (
                <TableRow
                  key={stock.stockSymbol}
                  className="border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/50"
                >
                  <TableCell className="font-medium text-green-900 dark:text-green-100">
                    <div>
                      <div className="font-semibold">{stock.stockName}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {stock.stockSymbol}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    {stock.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    {stock.avgPurchasePrice.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    {stock.currentPrice.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    {stock.currentValue.toLocaleString()}원
                  </TableCell>
                  <TableCell
                    className={`font-medium ${
                      stock.profitLoss >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {stock.profitLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {stock.profitLoss.toLocaleString()}원
                    </div>
                  </TableCell>
                  <TableCell
                    className={`font-medium ${
                      stock.profitLossRate >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {stock.profitLoss >= 0 ? "+" : ""}
                    {stock.profitLossRate.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
