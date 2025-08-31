"use client";

import { useState } from "react";
import { TradeHistory } from "@/types/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUp, ArrowDown } from "lucide-react";

interface TradeHistoryTableProps {
  trades: TradeHistory[];
}

export default function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "SELL">("ALL");

  // 거래내역 데이터 로깅
  console.log("📋 TradeHistoryTable 렌더링:", {
    tradesCount: trades.length,
    trades: trades,
  });

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = trade.stockSymbol
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || trade.tradeType === filterType;
    return matchesSearch && matchesType;
  });

  const sortedTrades = [...filteredTrades].sort(
    (a, b) =>
      new Date(b.tradeDate + " " + b.tradeTime).getTime() -
      new Date(a.tradeDate + " " + a.tradeTime).getTime()
  );

  if (trades.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">
            거래 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-green-700 dark:text-green-300">
            <p>거래 내역이 없습니다.</p>
            <p className="text-sm mt-2">첫 거래를 시작해보세요!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-green-900 dark:text-green-100">
          거래 내역 ({trades.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 검색 및 필터 */}
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 dark:text-green-400 w-4 h-4" />
            <Input
              placeholder="종목코드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                filterType === "ALL"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterType("BUY")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                filterType === "BUY"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50"
              }`}
            >
              매수
            </button>
            <button
              onClick={() => setFilterType("SELL")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                filterType === "SELL"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50"
              }`}
            >
              매도
            </button>
          </div>
        </div>

        {/* 거래 내역 테이블 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-green-200 dark:border-green-800">
                <TableHead className="text-green-900 dark:text-green-100">
                  거래일시
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  종목
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  구분
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  수량
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  단가
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  거래금액
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  수수료
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  순수익
                </TableHead>
                <TableHead className="text-green-900 dark:text-green-100">
                  거래후 잔고
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  className="border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/50"
                >
                  <TableCell className="text-green-900 dark:text-green-100">
                    <div>
                      <div className="font-medium">
                        {new Date(trade.tradeDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {trade.tradeTime}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    <div className="font-medium">{trade.stockSymbol}</div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`flex items-center gap-1 ${
                        trade.tradeType === "BUY"
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {trade.tradeType === "BUY" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {trade.tradeType === "BUY" ? "매수" : "매도"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    <div className="text-right">
                      {trade.quantity.toLocaleString()}주
                    </div>
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    <div className="text-right">
                      {trade.pricePerShare.toLocaleString()}원
                    </div>
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    <div className="text-right">
                      {trade.totalAmount.toLocaleString()}원
                    </div>
                  </TableCell>
                  <TableCell className="text-green-600 dark:text-green-400">
                    <div className="text-right">
                      {trade.commission.toLocaleString()}원
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`text-right font-medium ${
                        trade.tradeType === "BUY"
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {trade.netAmount.toLocaleString()}원
                    </div>
                  </TableCell>
                  <TableCell className="text-green-900 dark:text-green-100">
                    <div className="text-right">
                      <div>{trade.balanceAfterTrade.toLocaleString()}원</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {trade.stockQuantityAfterTrade.toLocaleString()}주
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 요약 정보 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-center">
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {trades.length}건
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              총 거래건수
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {trades.filter((t) => t.tradeType === "BUY").length}건
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              매수 건수
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {trades.filter((t) => t.tradeType === "SELL").length}건
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              매도 건수
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {trades
                .reduce((sum, t) => sum + t.commission, 0)
                .toLocaleString()}
              원
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              총 수수료
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
