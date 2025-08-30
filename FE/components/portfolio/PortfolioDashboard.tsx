"use client";

import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  PortfolioSummary,
  PortfolioStock,
  TradeHistory,
} from "@/types/portfolio";
import PortfolioSummaryCard from "./PortfolioSummaryCard";
import PortfolioStocksTable from "./PortfolioStocksTable";
import TradeHistoryTable from "./TradeHistoryTable";
import TradingModal from "./TradingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, History, Wallet } from "lucide-react";

export default function PortfolioDashboard() {
  const {
    loading,
    error,
    getPortfolioSummary,
    getPortfolioStocks,
    getTradeHistory,
    clearError,
  } = usePortfolio();

  const [portfolioSummary, setPortfolioSummary] =
    useState<PortfolioSummary | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setIsInitialLoading(true);
    setLoadErrors([]);
    clearError();

    try {
      // 개별적으로 API 호출하여 일부 실패해도 다른 데이터는 표시
      const summary = await getPortfolioSummary();
      if (summary) setPortfolioSummary(summary);

      const stocks = await getPortfolioStocks();
      if (stocks) setPortfolioStocks(stocks);

      const trades = await getTradeHistory();
      if (trades) setTradeHistory(trades);

      // 에러가 발생한 API가 있는지 확인
      const errors: string[] = [];
      if (!summary) errors.push("포트폴리오 요약");
      if (!stocks) errors.push("보유 주식 목록");
      if (!trades) errors.push("거래 내역");

      if (errors.length > 0) {
        setLoadErrors(errors);
      }
    } catch (err) {
      console.error("포트폴리오 데이터 로딩 실패:", err);
      setLoadErrors(["데이터 로딩 중 오류가 발생했습니다"]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleTradeSuccess = () => {
    setIsTradingModalOpen(false);
    loadPortfolioData(); // 데이터 새로고침
  };

  // 초기 로딩 중일 때
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-green-700 dark:text-green-300 text-lg">
            포트폴리오 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 에러가 발생했지만 일부 데이터는 있는 경우
  if (
    loadErrors.length > 0 &&
    !portfolioSummary &&
    !portfolioStocks.length &&
    !tradeHistory.length
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center space-y-2">
          <div className="text-red-500 text-xl font-semibold">
            데이터 로딩에 실패했습니다
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {loadErrors.join(", ")} 조회에 실패했습니다.
          </div>
        </div>
        <Button
          onClick={loadPortfolioData}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-green-900 dark:text-green-100">
            포트폴리오
          </h1>
          <p className="text-green-700 dark:text-green-300 mt-2 text-lg">
            하나증권 계좌 현황 및 거래 관리
          </p>
        </div>
        <Button
          onClick={() => setIsTradingModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 rounded-md flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          거래하기
        </Button>
      </div>

      {/* 포트폴리오 요약 카드 */}
      {portfolioSummary && <PortfolioSummaryCard summary={portfolioSummary} />}

      {/* 메인 콘텐츠 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            종합현황
          </TabsTrigger>
          <TabsTrigger value="stocks" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            보유주식
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            거래내역
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 계좌 정보 */}
            {portfolioSummary?.account && (
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-900 dark:text-green-100">
                    계좌 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      계좌번호
                    </span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {portfolioSummary.account.accountNumber || "정보 없음"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      계좌명
                    </span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {portfolioSummary.account.accountName || "정보 없음"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      증권사
                    </span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {portfolioSummary.account.broker || "정보 없음"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      개설일
                    </span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {portfolioSummary.account.createdDate
                        ? new Date(
                            portfolioSummary.account.createdDate
                          ).toLocaleDateString()
                        : "정보 없음"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 현금 현황 */}
            {portfolioSummary?.balance && (
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-900 dark:text-green-100">
                    현금 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      사용가능
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {portfolioSummary.balance.availableCash?.toLocaleString() ||
                        "0"}
                      원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      정산대기
                    </span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {portfolioSummary.balance.settlementCash?.toLocaleString() ||
                        "0"}
                      원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      인출가능
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {portfolioSummary.balance.withdrawableCash?.toLocaleString() ||
                        "0"}
                      원
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 주식 현황 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  주식 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    보유종목
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.totalStocks || 0}종목
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    평가금액
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.totalValue?.toLocaleString() || "0"}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    평가손익
                  </span>
                  <span
                    className={`font-medium ${
                      (portfolioSummary?.totalProfitLoss || 0) >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {portfolioSummary?.totalProfitLoss?.toLocaleString() || "0"}
                    원
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stocks">
          <PortfolioStocksTable
            stocks={portfolioStocks}
            onRefresh={loadPortfolioData}
          />
        </TabsContent>

        <TabsContent value="trades">
          <TradeHistoryTable trades={tradeHistory} />
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                포트폴리오 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300">
                분석 기능은 추후 구현 예정입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 거래 모달 */}
      <TradingModal
        isOpen={isTradingModalOpen}
        onClose={() => setIsTradingModalOpen(false)}
        onSuccess={handleTradeSuccess}
        portfolioStocks={portfolioStocks}
      />
    </div>
  );
}
